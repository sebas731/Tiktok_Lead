import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma/client'
import { HttpError } from '@/lib/api/response'
import { readSheetRows, findTabByGid, serviceAccountConfigured } from '@/lib/services/googleSheets'
import type { CampaignSyncSummary } from '@/lib/types'
import { sendLeadToThor } from '@/lib/webhooks/service'

const digits = (s: string) => (s.match(/\d/g) || []).length

// Tamaño de lote para insertar leads nuevos. createMany es una sola sentencia
// atómica; se trocea para acotar el tamaño del statement y aislar fallos.
const CHUNK = 200

/** ¿La celda parece un teléfono? (6-15 dígitos tras limpiar separadores). */
function looksLikePhone(s: string): boolean {
  return /^\d{6,15}$/.test(s.replace(/[\s+\-().]/g, ''))
}

/** Columna de teléfono: por encabezado, y si no, por contenido tipo teléfono. */
function detectPhoneColumn(rows: string[][]): number {
  const header = rows[0]
  const byHeader = header.findIndex((h) => /tel[eé]fono|n[uú]mero|celular|whatsapp|phone|\bcel\b/i.test(h))
  if (byHeader >= 0) return byHeader
  const cols = Math.max(...rows.map((r) => r.length), 0)
  let best = -1
  let bestCount = 0
  for (let c = 0; c < cols; c++) {
    let count = 0
    for (let r = 1; r < rows.length; r++) {
      if (rows[r][c] && looksLikePhone(rows[r][c])) count++
    }
    if (count > bestCount) { bestCount = count; best = c }
  }
  return best
}

/** Columna de nombre por su encabezado. */
function detectNameColumn(header: string[]): number {
  return header.findIndex((h) => /nombre|cliente|name/i.test(h))
}

async function markSyncError(campaignId: string, message: string) {
  await prisma.campaign.update({
    where: { campaign_id: campaignId },
    data: { lastSyncAt: new Date(), lastSyncStatus: 'ERROR', lastSyncError: message.slice(0, 500) },
  })
}

/** Persiste el resumen de una sincronización correcta (parcial o total). */
async function markSyncOk(campaignId: string, summary: CampaignSyncSummary, sheetTitle: string) {
  await prisma.campaign.update({
    where: { campaign_id: campaignId },
    data: {
      lastSyncAt: new Date(),
      lastSyncStatus: 'OK',
      lastSyncError: summary.errors.length > 0 ? `${summary.errors.length} fila(s) con error` : null,
      lastSyncSummary: summary as unknown as Prisma.InputJsonValue,
      excelSheetName: sheetTitle || undefined,
    },
  })
}

/**
 * Sincroniza todas las campañas EXCEL activas con autoSync habilitado.
 * La usa el endpoint /api/cron/sync (llamado por un cron externo). Cada
 * campaña se aísla: si una falla, el resto continúa (y el error queda
 * persistido en la propia campaña por syncExcelCampaign).
 */
export async function syncAllAutoCampaigns() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      source: 'EXCEL',
      status: true,
      autoSync: true,
      excelUrl: { not: null },
      excelGid: { not: null },
    },
    select: { campaign_id: true, name: true },
  })
  const results: { campaign: string; ok: boolean; imported?: number; error?: string }[] = []
  for (const c of campaigns) {
    try {
      const r = await syncExcelCampaign(c.campaign_id)
      results.push({ campaign: c.name, ok: true, imported: r.created })
    } catch (e) {
      results.push({ campaign: c.name, ok: false, error: e instanceof Error ? e.message : 'Error' })
    }
  }
  return { total: campaigns.length, ok: results.filter((r) => r.ok).length, results }
}


export async function syncExcelCampaign(campaignId: string ): Promise<CampaignSyncSummary> {
  const campaign = await prisma.campaign.findUnique({ where: { campaign_id: campaignId } })
  if (!campaign) throw new HttpError(404, 'Campaña no encontrada')
  if (campaign.source !== 'EXCEL' || !campaign.excelUrl) {
    throw new HttpError(400, 'La campaña no es de origen EXCEL o no tiene URL')
  }
  if (!campaign.excelGid) throw new HttpError(400, 'La campaña no tiene una pestaña seleccionada')

  try {
    let sheetTitle = campaign.excelSheetName ?? ''
    let renamed: { from: string; to: string } | null = null

    // 1. Detección de renombrado/eliminación por gid (requiere Sheets API). En
    //    PUBLIC_CSV sin Service Account se omite y se lee directamente por gid.
    const canInspect = campaign.sheetAccessMode === 'SERVICE_ACCOUNT' || serviceAccountConfigured()
    if (canInspect) {
      const tab = await findTabByGid(campaign.excelUrl, campaign.excelGid)
      if (!tab) {
        const msg = `La pestaña (gid ${campaign.excelGid}) ya no existe en el documento. Selecciona otra.`
        await markSyncError(campaignId, msg)
        throw new HttpError(400, msg)
      }
      if (tab.title !== campaign.excelSheetName) {
        renamed = { from: campaign.excelSheetName ?? '(sin nombre)', to: tab.title }
      }
      sheetTitle = tab.title
    }

    // 2. Leer filas (interfaz común: pública o privada)
    const rows = await readSheetRows({
      url: campaign.excelUrl,
      mode: campaign.sheetAccessMode,
      gid: campaign.excelGid,
      sheetTitle,
    })

    if (rows.length < 2) {
      const empty: CampaignSyncSummary = { totalRows: 0, created: 0, existing: 0, discarded: 0, errors: [], renamed }
      await markSyncOk(campaignId, empty, sheetTitle || campaign.excelSheetName || '')
      return empty
    }

    // 3. Toda la pestaña pertenece a esta campaña (sin filtrar por columna).
    //    Se valida cada fila y se guarda su nº de fila real para el reporte.
    const phoneCol = detectPhoneColumn(rows)
    if (phoneCol < 0) throw new HttpError(400, 'No se encontró una columna de teléfono en la pestaña')
    const nameCol = detectNameColumn(rows[0])

    const totalRows = rows.length - 1
    let discarded = 0
    const seen = new Set<string>()
    const candidates: { client_number: string; name_client: string | null; row: number }[] = []
    for (let r = 1; r < rows.length; r++) {
      const phone = (rows[r][phoneCol] || '').trim()
      // Fila inválida (sin teléfono / muy corto) o duplicada dentro de la hoja.
      if (!phone || digits(phone) < 6 || seen.has(phone)) { discarded++; continue }
      seen.add(phone)
      candidates.push({
        client_number: phone,
        name_client: nameCol >= 0 ? (rows[r][nameCol] || '').trim() || null : null,
        row: r + 1, // fila real en la hoja (1 = encabezado)
      })
    }
   

    // 4. Pre-check barato: qué client_number ya existen (UNA sola consulta).
    //    En el caso común (nada nuevo) esto termina en un SELECT y cero escrituras.
    const existingSet = new Set(
      (
        await prisma.lead.findMany({
          where: { campaignId, client_number: { in: candidates.map((c) => c.client_number) } },
          select: { client_number: true },
        })
      ).map((l) => l.client_number),
    )
    const nuevos = candidates.filter((c) => !existingSet.has(c.client_number))
    const existing = candidates.length - nuevos.length


       // 5. Insertar SOLO los nuevos, por lotes, SIN transacción interactiva. Si un
        //    lote falla, se reintenta fila por fila para aislar el/los problema(s).
        //    En modo ESTRICTO NO se crean leads (solo se reenvían a Thor).
        const crearLeads = campaign.thorMode !== 'ESTRICTO'
        let created = 0
        const errors: { row: number; reason: string }[] = []
        if (crearLeads) {
          for (let i = 0; i < nuevos.length; i += CHUNK) {
            const chunk = nuevos.slice(i, i + CHUNK)
            try {
              const res = await prisma.lead.createMany({
                data: chunk.map((c) => ({ client_number: c.client_number, name_client: c.name_client, campaignId, reason: '' })),
                skipDuplicates: true, // idempotente + cubre carreras entre crons
              })
              created += res.count
            } catch {
              for (const c of chunk) {
                try {
                  await prisma.lead.create({ data: { client_number: c.client_number, name_client: c.name_client, campaignId, reason: '' } })
                  created++
                } catch (e) {
                  errors.push({ row: c.row, reason: e instanceof Error ? e.message : 'Error al insertar' })
                }
              }
            }
          }
        }

        // 6. Reenvío al Thor de Jesús (best-effort). ESTRICTO: solo envía; PARALELO:
        //    crea (arriba) Y envía. Se envían los "nuevos" secuencial para no saturar.
        if ((campaign.thorMode === 'ESTRICTO' || campaign.thorMode === 'PARALELO') && campaign.thorSlug) {
          for (const c of nuevos) {
            await sendLeadToThor(c.client_number, campaignId, campaign.name, campaign.thorSlug)
          }
        }

        const summary: CampaignSyncSummary = { totalRows, created, existing, discarded, errors, renamed }
        await markSyncOk(campaignId, summary, sheetTitle || campaign.excelSheetName || '')
        return summary

  } catch (e) {
    // No fallar en silencio: deja el motivo persistido y visible en la UI.
    if (!(e instanceof HttpError)) {
      await markSyncError(campaignId, e instanceof Error ? e.message : 'Error desconocido')
    }
    throw e
  }
}
