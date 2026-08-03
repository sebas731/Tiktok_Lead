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
  _count?: { lead: number }
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
  asignadoA?: { user_id: string; name: string } | null
  saleDetail?: { id: string } | null
}

export type SaleDetail = {
  id: string
  leadId: string
  agenteNombre: string
  supervisorNombre: string
  canalVenta: string
  titularNombre: string
  contactoNombre: string
  parentesco: string
  nombrePadres: string | null
  tipoDocumento: string
  numeroDocumento: string
  numeroGrabacion: string | null
  numeroLlamadas: number
  editadoPorBackId: string | null
}
