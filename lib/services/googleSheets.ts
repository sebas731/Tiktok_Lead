import { google, type sheets_v4 } from 'googleapis'
import { HttpError } from '@/lib/api/response'

export type SheetTab = { gid: number; title: string; index: number }
export type SheetAccessMode = 'PUBLIC_CSV' | 'SERVICE_ACCOUNT'

const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const SA_KEY_RAW = process.env.GOOGLE_PRIVATE_KEY

/** ¿Están configuradas las credenciales de la Service Account? */
export function serviceAccountConfigured(): boolean {
  return Boolean(SA_EMAIL && SA_KEY_RAW)
}

/** Extrae el spreadsheetId de una URL de Google Sheets. */
export function parseSpreadsheetId(url: string): string {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!m) throw new HttpError(400, 'La URL no es un Google Sheet válido')
  return m[1]
}

function getSheetsClient(): sheets_v4.Sheets {
  if (!SA_EMAIL || !SA_KEY_RAW) {
    throw new HttpError(
      500,
      'Faltan credenciales de la Service Account (GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY en el .env)',
    )
  }
  // La private key llega con \n escapados en el .env; hay que convertirlos a
  // saltos reales o la autenticación falla con un error poco descriptivo.
  const key = SA_KEY_RAW.replace(/\\n/g, '\n')
  const auth = new google.auth.JWT({
    email: SA_EMAIL,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'], // lectura + escritura (write-back de estado)
  })
  return google.sheets({ version: 'v4', auth })
}

/** Traduce errores de la API de Google a mensajes claros para el admin. */
function mapSheetsError(e: unknown): HttpError {
  if (e instanceof HttpError) return e
  const err = e as { code?: number | string; message?: string; response?: { status?: number } }
  const status = Number(err.code ?? err.response?.status)
  if (status === 403) {
    return new HttpError(403, `La Service Account no tiene acceso a la hoja. Compártela como LECTOR con: ${SA_EMAIL}`)
  }
  if (status === 404) return new HttpError(404, 'No se encontró el documento (revisa la URL del Sheet)')
  if (status === 400 || status === 401) {
    return new HttpError(500, 'Credenciales de Service Account inválidas o mal configuradas (revisa GOOGLE_PRIVATE_KEY)')
  }
  return new HttpError(502, 'Error consultando Google Sheets: ' + (err.message ?? 'desconocido'))
}

/** Parser CSV que respeta comillas, comas y saltos de línea dentro de campos. */
export function parseCsv(text: string): string[][] {
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

/**
 * Lista todas las pestañas del documento con su gid, título e índice.
 * Usa la Sheets API (Service Account); funciona con hojas públicas y privadas.
 */
export async function listSheetTabs(url: string): Promise<SheetTab[]> {
  const spreadsheetId = parseSpreadsheetId(url)
  const sheets = getSheetsClient()
  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties(sheetId,title,index)',
    })
    const tabs = (res.data.sheets ?? [])
      .map((s) => s.properties)
      .filter((p): p is sheets_v4.Schema$SheetProperties => Boolean(p))
      .map((p) => ({ gid: p.sheetId ?? 0, title: p.title ?? '', index: p.index ?? 0 }))
      .sort((a, b) => a.index - b.index)
    if (tabs.length === 0) throw new HttpError(404, 'El documento no tiene pestañas accesibles')
    return tabs
  } catch (e) {
    throw mapSheetsError(e)
  }
}

/** Busca una pestaña por su gid (para detectar renombrados/eliminaciones). null si no existe. */
export async function findTabByGid(url: string, gid: string): Promise<SheetTab | null> {
  const tabs = await listSheetTabs(url)
  const g = Number(gid)
  return tabs.find((t) => t.gid === g) ?? null
}

async function readViaServiceAccount(url: string, sheetTitle: string): Promise<string[][]> {
  const spreadsheetId = parseSpreadsheetId(url)
  const sheets = getSheetsClient()
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetTitle.replace(/'/g, "''")}'`,
    })
    return (res.data.values ?? []).map((r) => r.map((c) => (c == null ? '' : String(c))))
  } catch (e) {
    throw mapSheetsError(e)
  }
}

async function readViaPublicCsv(url: string, gid: string): Promise<string[][]> {
  const spreadsheetId = parseSpreadsheetId(url)
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${encodeURIComponent(gid)}`
  let res: Response
  try {
    res = await fetch(csvUrl, { redirect: 'follow' })
  } catch (e) {
    throw new HttpError(502, 'No se pudo conectar con Google: ' + (e instanceof Error ? e.message : ''))
  }
  if (!res.ok) {
    if (res.status === 400 || res.status === 404) {
      throw new HttpError(404, 'No se pudo leer la pestaña por CSV (¿fue eliminada, o la hoja no es pública?)')
    }
    throw new HttpError(502, `No se pudo leer el CSV público (HTTP ${res.status})`)
  }
  const text = await res.text()
  // Si Google devuelve HTML (pantalla de login), la hoja no es pública.
  if (text.trimStart().startsWith('<')) {
    throw new HttpError(403, 'La hoja no es pública. Compártela como "cualquiera con el enlace" o usa el modo Service Account.')
  }
  return parseCsv(text)
}

export type ReadRowsOpts = { url: string; mode: SheetAccessMode; gid: string; sheetTitle: string }

/**
 * Lee las filas de una pestaña. Interfaz común: el resto del código no sabe si
 * la hoja es pública (CSV) o privada (Service Account).
 */
export async function readSheetRows(opts: ReadRowsOpts): Promise<string[][]> {
  return opts.mode === 'SERVICE_ACCOUNT'
    ? readViaServiceAccount(opts.url, opts.sheetTitle)
    : readViaPublicCsv(opts.url, opts.gid)
}

const onlyDigits = (s: string) => s.replace(/\D/g, '')

/** Índice de columna (0-based) → letra A1 (0→A, 26→AA). */
function colLetter(idx: number): string {
  let n = idx + 1
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/** Columna de teléfono en la hoja (encabezado o contenido). -1 si no hay. */
function detectPhoneColumnRows(rows: string[][]): number {
  const header = rows[0] ?? []
  const byHeader = header.findIndex((h) => /tel[eé]fono|n[uú]mero|celular|whatsapp|phone|\bcel\b/i.test(h))
  if (byHeader >= 0) return byHeader
  const cols = Math.max(...rows.map((r) => r.length), 0)
  let best = -1
  let bestCount = 0
  for (let c = 0; c < cols; c++) {
    let count = 0
    for (let r = 1; r < rows.length; r++) {
      const v = onlyDigits(rows[r][c] || '')
      if (v.length >= 6 && v.length <= 15) count++
    }
    if (count > bestCount) { bestCount = count; best = c }
  }
  return best
}

/**
 * Escribe el estado y sub-estado del lead en su fila del Sheet, en las columnas
 * "ESTADO" / "SUB-ESTADO" (si no existen, las crea al final). Solo hojas privadas
 * (SERVICE_ACCOUNT). Best-effort: no lanza si la hoja no es escribible.
 */
export async function writeLeadStatusToSheet(opts: {
  url: string
  mode: SheetAccessMode
  gid: string
  sheetTitle: string | null
  clientNumber: string
  estado: string
  subEstado: string
}): Promise<void> {
  if (opts.mode !== 'SERVICE_ACCOUNT' || !serviceAccountConfigured()) return
  const spreadsheetId = parseSpreadsheetId(opts.url)
  const sheets = getSheetsClient()

  let title = opts.sheetTitle
  if (!title) {
    const tab = await findTabByGid(opts.url, opts.gid)
    if (!tab) return
    title = tab.title
  }
  const safeTitle = `'${title.replace(/'/g, "''")}'`

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: safeTitle })
  const rows = (res.data.values ?? []).map((r) => r.map((c) => (c == null ? '' : String(c))))
  if (rows.length < 1) return
  const header = rows[0]

  const phoneCol = detectPhoneColumnRows(rows)
  if (phoneCol < 0) return
  const target = onlyDigits(opts.clientNumber)
  let rowIdx = -1
  for (let r = 1; r < rows.length; r++) {
    if (onlyDigits(rows[r][phoneCol] || '') === target) { rowIdx = r; break }
  }
  if (rowIdx < 0) return // la fila ya no está en la hoja

  let estadoCol = header.findIndex((h) => /^\s*estado\s*$/i.test(h))
  let subCol = header.findIndex((h) => /sub[\s_-]*estado/i.test(h))
  const data: { range: string; values: string[][] }[] = []
  let nextNew = header.length
  if (estadoCol < 0) { estadoCol = nextNew++; data.push({ range: `${safeTitle}!${colLetter(estadoCol)}1`, values: [['ESTADO']] }) }
  if (subCol < 0) { subCol = nextNew++; data.push({ range: `${safeTitle}!${colLetter(subCol)}1`, values: [['SUB-ESTADO']] }) }

  const sheetRow = rowIdx + 1 // fila real (1-based)
  data.push({ range: `${safeTitle}!${colLetter(estadoCol)}${sheetRow}`, values: [[opts.estado]] })
  data.push({ range: `${safeTitle}!${colLetter(subCol)}${sheetRow}`, values: [[opts.subEstado]] })

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'RAW', data },
  })
}
