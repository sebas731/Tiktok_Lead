import { prisma } from '@/lib/prisma'
import { Prisma, LEAD_STATUS, LEAD_SUBSTATUS } from '@/lib/generated/prisma/client'
import { HttpError, requireEnum, requireString } from '@/lib/api/response'
import { type AuthUser, leadWhereForUser } from '@/lib/auth/authorize'

/** Devuelve el lead si es visible para el usuario; si no, lanza 404. */
export async function getVisibleLead(user: AuthUser, id: string) {
  const lead = await prisma.lead.findFirst({
    where: { AND: [leadWhereForUser(user), { id }] },
  })
  if (!lead) throw new HttpError(404, 'Lead no encontrado o sin acceso')
  return lead
}

export type LeadFilters = { campaignId?: string | null; status?: string | null }

/** Lista leads visibles según rol, con filtros opcionales por campaña y status. */
export function listLeads(user: AuthUser, filters: LeadFilters) {
  const extra: Prisma.LeadWhereInput = {}
  if (filters.campaignId) extra.campaignId = filters.campaignId
  if (filters.status) extra.status = requireEnum(filters.status, LEAD_STATUS, 'status')
  return prisma.lead.findMany({
    where: { AND: [leadWhereForUser(user), extra] },
    orderBy: { id: 'asc' },
    include: {
      asignadoA: { select: { user_id: true, name: true } },
      saleDetail: { select: { id: true } },
    },
  })
}

/** Actualiza status, sub_status, observaciones y reason de un lead accesible. */
export async function updateLead(user: AuthUser, id: string, input: Record<string, unknown>) {
  await getVisibleLead(user, id)
  const data: Prisma.LeadUpdateInput = {}
  if (input.status !== undefined) data.status = requireEnum(input.status, LEAD_STATUS, 'status')
  if (input.sub_status !== undefined) {
    data.sub_status = requireEnum(input.sub_status, LEAD_SUBSTATUS, 'sub_status')
  }
  if (typeof input.observations === 'string') data.observations = input.observations
  if (typeof input.reason === 'string') data.reason = input.reason
  return prisma.lead.update({ where: { id }, data })
}

/** ADMIN, o SUPERVISOR con esa campaña asignada. */
async function assertCanAssignInCampaign(user: AuthUser, campaignId: string) {
  if (user.role === 'ADMIN') return
  if (user.role !== 'SUPERVISOR') throw new HttpError(403, 'No tienes permiso para asignar leads')
  const assigned = await prisma.campaignAssignment.count({
    where: { campaignId, userId: user.userId },
  })
  if (assigned === 0) throw new HttpError(403, 'Esa campaña no está asignada a ti')
}

export type AssignLeadsInput = {
  campaignId?: unknown
  asesorId?: unknown
  leadIds?: unknown
}

/** Asigna una lista de leads de una campaña a un asesor (crea historial). */
export async function assignLeads(user: AuthUser, input: AssignLeadsInput) {
  const campaignId = requireString(input.campaignId, 'campaignId')
  const asesorId = requireString(input.asesorId, 'asesorId')
  if (!Array.isArray(input.leadIds) || input.leadIds.length === 0) {
    throw new HttpError(400, 'Debes enviar leadIds (array no vacío)')
  }
  const leadIds = input.leadIds.map((v, i) => requireString(v, `leadIds[${i}]`))

  await assertCanAssignInCampaign(user, campaignId)

  const asesor = await prisma.user.findFirst({
    where: { user_id: asesorId, rol: { name: 'ASESOR' } },
    select: { user_id: true },
  })
  if (!asesor) throw new HttpError(400, 'El destinatario debe ser un usuario ASESOR')

  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds }, campaignId },
    select: { id: true },
  })
  if (leads.length !== leadIds.length) {
    throw new HttpError(400, 'Algunos leads no pertenecen a esa campaña')
  }

  await prisma.$transaction([
    prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { asignadoAId: asesorId },
    }),
    prisma.leadAssignment.createMany({
      data: leadIds.map((leadId) => ({ leadId, asesorId, asignadoPorId: user.userId })),
    }),
  ])
  return { assigned: leadIds.length, asesorId }
}
