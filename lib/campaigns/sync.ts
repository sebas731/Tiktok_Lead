import { prisma } from '@/lib/prisma'
import { HttpError } from '@/lib/api/response'

/** Construye la URL de exportación CSV de un Google Sheet a partir de su URL + gid. */
function buildCsvUrl(excelUrl: string, excelGid: string | null): string {
  const m = excelUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!m) {
    // Puede que ya sea una URL de export directa.
    if (excelUrl.includes('format=csv')) return excelUrl
    throw new HttpError(400, 'La URL del Sheet no es válida')
  }
  const gid = excelGid || '0'
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`
}

/** Parser CSV que respeta comillas, comas y saltos de línea dentro de campos. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

const digits = (s: string) => (s.match(/\d/g) || []).length

/** ¿La celda parece un teléfono? (solo dígitos/espacios/+/-/() y 6-15 dígitos). */
function looksLikePhone(s: string): boolean {
  const cleaned = s.replace(/[\s+\-().]/g, '')
  return /^\d{6,15}$/.test(cleaned)
}

/**
 * Columna de teléfono. Primero por encabezado (número/teléfono/celular…),
 * si no, por contenido tipo teléfono. Excluye la columna de campaña para no
 * confundir nombres de campaña que contienen números (ej. "|300| PLAN 69").
 */
function detectPhoneColumn(rows: string[][], skipCol: number): number {
  const header = rows[0]
  const byHeader = header.findIndex(
    (h, i) => i !== skipCol && /tel[eé]fono|n[uú]mero|celular|whatsapp|phone|\bcel\b/i.test(h)
  )
  if (byHeader >= 0) return byHeader

  const cols = Math.max(...rows.map((r) => r.length), 0)
  let best = -1
  let bestCount = 0
  for (let c = 0; c < cols; c++) {
    if (c === skipCol) continue
    let count = 0
    for (let r = 1; r < rows.length; r++) {
      if (rows[r][c] && looksLikePhone(rows[r][c])) count++
    }
    if (count > bestCount) { bestCount = count; best = c }
  }
  return best
}

/** Detecta una columna de nombre por su encabezado. */
function detectNameColumn(header: string[]): number {
  return header.findIndex((h) => /nombre|cliente|name/i.test(h))
}

/** Normaliza: recorta, colapsa espacios internos y pasa a minúsculas. */
function norm(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Clave de comparación tolerante para el valor de campaña: minúsculas, sin
 * tildes y solo letras/números. Así `C3 ... |300| ... DÍA` coincide con
 * `c3 ... [300] ... dia` y demás variaciones de puntuación/espacios/tildes.
 */
function matchKey(s: string): string {
  return s
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Columna de campaña: por índice o nombre si se configuró `excelCampaignColumn`,
 * si no, busca un header que contenga "campaña"/"campaign".
 */
function detectCampaignColumn(header: string[], configured: string | null): number {
  if (configured) {
    if (/^\d+$/.test(configured.trim())) return parseInt(configured, 10)
    const idx = header.findIndex((h) => norm(h) === norm(configured))
    if (idx >= 0) return idx
  }
  return header.findIndex((h) => /campa[ñn]a|campaign/i.test(h))
}

/**
 * Descarga el Sheet de una campaña EXCEL y crea leads de forma idempotente
 * (unique client_number+campaignId). Devuelve cuántos se importaron.
 */
export async function syncExcelCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { campaign_id: campaignId } })
  if (!campaign) throw new HttpError(404, 'Campaña no encontrada')
  if (campaign.source !== 'EXCEL' || !campaign.excelUrl) {
    throw new HttpError(400, 'La campaña no es de origen EXCEL o no tiene URL')
  }
  if (!campaign.excelCampaignFilter) {
    throw new HttpError(400, 'La campaña no tiene configurado el valor de campaña en la hoja')
  }

  const url = buildCsvUrl(campaign.excelUrl, campaign.excelGid)
  let csv: string
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    csv = await res.text()
  } catch (e) {
    throw new HttpError(502, 'No se pudo leer el Google Sheet: ' + (e instanceof Error ? e.message : ''))
  }

  const rows = parseCsv(csv)
  if (rows.length < 2) return { imported: 0, total: 0 }

  // La columna de campaña primero: se excluye al detectar el teléfono, para no
  // confundir nombres de campaña que contienen números.
  const campaignCol = detectCampaignColumn(rows[0], campaign.excelCampaignColumn)
  if (campaignCol < 0) {
    throw new HttpError(400, 'No se encontró la columna de campaña en el Sheet')
  }
  const phoneCol = detectPhoneColumn(rows, campaignCol)
  if (phoneCol < 0) throw new HttpError(400, 'No se encontró una columna de teléfono en el Sheet')
  const nameCol = detectNameColumn(rows[0])
  const target = matchKey(campaign.excelCampaignFilter)

  const seen = new Set<string>()
  const leads: { client_number: string; name_client: string | null; campaignId: string; reason: string }[] = []
  let matched = 0
  for (let r = 1; r < rows.length; r++) {
    // Solo filas cuya columna de campaña coincida (comparación tolerante a
    // puntuación, tildes y mayúsculas).
    if (matchKey(rows[r][campaignCol] || '') !== target) continue
    matched++
    const phone = (rows[r][phoneCol] || '').trim()
    if (!phone || digits(phone) < 6 || seen.has(phone)) continue
    seen.add(phone)
    leads.push({
      client_number: phone,
      name_client: nameCol >= 0 ? (rows[r][nameCol] || '').trim() || null : null,
      campaignId,
      reason: '',
    })
  }

  const result = await prisma.lead.createMany({ data: leads, skipDuplicates: true })
  await prisma.campaign.update({ where: { campaign_id: campaignId }, data: { lastSyncAt: new Date() } })
  return { imported: result.count, matched, total: leads.length }
}
