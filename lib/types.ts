// DTOs ligeros para el frontend (evitan importar el cliente Prisma al navegador).

export type Role = 'ADMIN' | 'SUPERVISOR' | 'ASESOR' | 'BACK'

export type Me = {
  user_id: string
  login: string
  email: string
  name: string
  first_last_name: string
  second_last_name: string
  department: string
  document_type: string
  document_number: string
  status: boolean
  rol: { id_rol: string; name: string }
}

export type Campaign = {
  campaign_id: string
  name: string
  denomination: string | null
  status: boolean
  leadMode: 'NORMAL' | 'AUTO'
  autoSync: boolean
  source: 'TIKTOK' | 'EXCEL'
  tiktokCampaignId: string | null
  tiktokAdvertiserId: string | null
  keyId: string | null
  excelUrl: string | null
  excelGid: string | null
  excelSheetName: string | null
  sheetAccessMode: 'PUBLIC_CSV' | 'SERVICE_ACCOUNT'
  lastSyncAt: string | null
  lastSyncStatus: 'OK' | 'ERROR' | null
  lastSyncError: string | null
  lastSyncSummary: CampaignSyncSummary | null
  _count?: { lead: number }
}

export type SheetTab = { gid: number; title: string; index: number }

/** Fila del reporte de leads procesados por asesor. */
export type ProcessedByAsesorRow = {
  asesorId: string
  asesorName: string
  asesorDni: string
  total: number
  byStatus: Record<string, number>
}

/** Detalle de una gestión (lead procesado) para el reporte. */
export type ProcessedDetailRow = {
  id: string
  processedAt: string
  status: string
  subStatus: string
  observations: string | null
  reason: string
  leadId: string
  leadNumber: string
  saleCode: string | null
  campaignName: string
  asesorName: string
  asesorDni: string
  supervisorName: string
}

/** Resumen de una sincronización de leads desde Google Sheets. */
export type CampaignSyncSummary = {
  totalRows: number // filas de datos leídas (sin el encabezado)
  created: number // leads nuevos insertados
  existing: number // ya existían (omitidos, no se tocan)
  discarded: number // filas sin teléfono válido o duplicadas en la hoja
  errors: { row: number; reason: string }[] // fallos individuales con nº de fila
  renamed: { from: string; to: string } | null
}

export type Lead = {
  id: string
  name_client: string | null
  client_number: string
  status: string
  sub_status: string
  observations: string | null
  reason: string
  campaignId: string
  asignadoAId: string | null
  asignadoA?: {
    user_id: string
    name: string
    first_last_name?: string
    second_last_name?: string
    document_number?: string
  } | null
  sale?: { id_sale: string } | null
  campaign?: { campaign_id: string; name: string } | null
}

// Los tipos de venta (Client/Sale/SaleDetail/InstallationSchedule) se agregan
// cuando se construya la API/UI de ventas (Fases 3/5).

export type SaleRow = {
  id_sale: string
  code: string
  reason: string
  sub_reason: string | null
  sale_date: string
  createdAt: string
  backOfficeId: string | null
  client?: { titular_name: string; last_names: string; document_number: string }
  campaign?: { campaign_id: string; name: string }
  advisor?: { user_id: string; name: string }
  managerAdvisor?: { user_id: string; name: string } | null
  sede?: { sede_id: string; code: string; name?: string }
  backOffice?: { user_id: string; name: string } | null
}

export type Sede = {
  sede_id: string
  code: string
  name: string
  address: string | null
  status: boolean
  _count?: { sales: number }
}

export type Grupo = {
  grupo_id: string
  name: string
  status: boolean
  supervisor: { user_id: string; name: string }
  sede: { sede_id: string; code: string; name: string }
  members: { asesor: { user_id: string; name: string } }[]
}

export type KeyRow = {
  id: string
  name: string
  advertiserId: string
  tokenMasked: string
  expiresAt: string | null
  status: boolean
  campaignCount: number
}

type NameParts = { name: string; first_last_name?: string; second_last_name?: string }

/** Nombre completo de un usuario (nombres + apellidos), sin espacios sobrantes. */
export function fullName(u: NameParts): string {
  return [u.name, u.first_last_name, u.second_last_name].filter(Boolean).join(' ').trim() || u.name
}

/** Etiqueta de usuario/asesor: nombre completo con el DNI entre paréntesis. */
export function userLabel(u: NameParts & { document_number?: string }): string {
  return u.document_number ? `${fullName(u)} (${u.document_number})` : fullName(u)
}
