import { prisma } from '@/lib/prisma'
import { Prisma, DocumentType, LEAD_STATUS } from '@/lib/generated/prisma/client'
import { HttpError, requireEnum, requireString } from '@/lib/api/response'
import { type AuthUser } from '@/lib/auth/authorize'
import { getVisibleLead } from '@/lib/leads/service'

/** Construye los datos del detalle de venta desde el body (validado). */
function buildSaleData(input: Record<string, unknown>) {
  const data = {
    agenteNombre: requireString(input.agenteNombre, 'agenteNombre'),
    supervisorNombre: requireString(input.supervisorNombre, 'supervisorNombre'),
    canalVenta: requireString(input.canalVenta, 'canalVenta'),
    titularNombre: requireString(input.titularNombre, 'titularNombre'),
    contactoNombre: requireString(input.contactoNombre, 'contactoNombre'),
    parentesco: requireString(input.parentesco, 'parentesco'),
    tipoDocumento: requireEnum(input.tipoDocumento, DocumentType, 'tipoDocumento'),
    numeroDocumento: requireString(input.numeroDocumento, 'numeroDocumento'),
    nombrePadres: typeof input.nombrePadres === 'string' ? input.nombrePadres : null,
    numeroGrabacion: typeof input.numeroGrabacion === 'string' ? input.numeroGrabacion : null,
    numeroLlamadas: typeof input.numeroLlamadas === 'number' ? input.numeroLlamadas : 0,
  }
  return data
}

/** Devuelve el detalle de venta de un lead accesible (o 404). */
export async function getSale(user: AuthUser, leadId: string) {
  await getVisibleLead(user, leadId)
  const sale = await prisma.leadSaleDetail.findUnique({ where: { leadId } })
  if (!sale) throw new HttpError(404, 'Este lead no tiene detalle de venta')
  return sale
}

/** Crea el detalle de venta cuando el lead está en POSITIVO. */
export async function createSale(user: AuthUser, leadId: string, input: Record<string, unknown>) {
  const lead = await getVisibleLead(user, leadId)
  if (lead.status !== LEAD_STATUS.POSITIVO) {
    throw new HttpError(400, 'El lead debe estar en status POSITIVO para registrar la venta')
  }
  const data: Prisma.LeadSaleDetailCreateInput = {
    ...buildSaleData(input),
    lead: { connect: { id: leadId } },
  }
  return prisma.leadSaleDetail.create({ data })
}

/** Edita el detalle de venta. Si el editor es BACK, registra su id. */
export async function updateSale(user: AuthUser, leadId: string, input: Record<string, unknown>) {
  await getVisibleLead(user, leadId)
  const existing = await prisma.leadSaleDetail.findUnique({ where: { leadId } })
  if (!existing) throw new HttpError(404, 'Este lead no tiene detalle de venta')

  const data: Prisma.LeadSaleDetailUpdateInput = { ...buildSaleData(input) }
  if (user.role === 'BACK') {
    data.editadoPorBack = { connect: { user_id: user.userId } }
  }
  return prisma.leadSaleDetail.update({ where: { leadId }, data })
}
