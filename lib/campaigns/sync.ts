import { prisma } from '@/lib/prisma'
import { HttpError } from '@/lib/api/response'
import { readSheetRows, findTabByGid, serviceAccountConfigured } from '@/lib/services/googleSheets'

const digits = (s: string) => (s.match(/\d/g) || []).length

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

export type SyncResult = {
  imported: number
  total: number
  renamed: { from: string; to: string } | null
}

/**
 * Sincroniza los leads de una campaña Excel. Una pestaña = una campaña: se lee
 * la pestaña completa (identificada por gid). Idempotente: nunca sobreescribe la
 * gestión de los asesores (upsert con update vacío).
 */
export async function syncExcelCampaign(campaignId: string): Promise<SyncResult> {
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
      await prisma.campaign.update({
        where: { campaign_id: campaignId },
        data: { lastSyncAt: new Date(), lastSyncStatus: 'OK', lastSyncError: null, excelSheetName: sheetTitle || campaign.excelSheetName },
      })
      return { imported: 0, total: 0, renamed }
    }

    // 3. Toda la pestaña pertenece a esta campaña (sin filtrar por columna)
    const phoneCol = detectPhoneColumn(rows)
    if (phoneCol < 0) throw new HttpError(400, 'No se encontró una columna de teléfono en la pestaña')
    const nameCol = detectNameColumn(rows[0])

    const seen = new Set<string>()
    const leads: { client_number: string; name_client: string | null }[] = []
    for (let r = 1; r < rows.length; r++) {
      const phone = (rows[r][phoneCol] || '').trim()
      if (!phone || digits(phone) < 6 || seen.has(phone)) continue
      seen.add(phone)
      leads.push({ client_number: phone, name_client: nameCol >= 0 ? (rows[r][nameCol] || '').trim() || null : null })
    }

    // 4. Cuántos son nuevos (para reportar), luego upsert idempotente
    const existing = new Set(
      (
        await prisma.lead.findMany({
          where: { campaignId, client_number: { in: leads.map((l) => l.client_number) } },
          select: { client_number: true },
        })
      ).map((l) => l.client_number),
    )

    await prisma.$transaction(
      leads.map((l) =>
        prisma.lead.upsert({
          where: { client_number_campaignId: { client_number: l.client_number, campaignId } },
          create: { client_number: l.client_number, name_client: l.name_client, campaignId, reason: '' },
          update: {}, // nunca pisa status/sub_status/observaciones/asignación
        }),
      ),
    )

    const imported = leads.filter((l) => !existing.has(l.client_number)).length
    await prisma.campaign.update({
      where: { campaign_id: campaignId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'OK',
        lastSyncError: null,
        excelSheetName: sheetTitle || campaign.excelSheetName, // refresca el nombre si cambió
      },
    })
    return { imported, total: leads.length, renamed }
  } catch (e) {
    // No fallar en silencio: deja el motivo persistido y visible en la UI.
    if (!(e instanceof HttpError)) {
      await markSyncError(campaignId, e instanceof Error ? e.message : 'Error desconocido')
    }
    throw e
  }
}
