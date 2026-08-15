import { prisma } from '@/lib/prisma'
import { Prisma, LEAD_STATUS, LEAD_SUBSTATUS } from '@/lib/generated/prisma/client'
import { HttpError, requireEnum, requireString } from '@/lib/api/response'
import { type AuthUser, getLeadFilter } from '@/lib/auth/authorize'

/** Devuelve el lead si es visible para el usuario; si no, lanza 404. */
export async function getVisibleLead(user: AuthUser, id: string) {
  const lead = await prisma.lead.findFirst({
    where: { AND: [getLeadFilter(user), { id }] },
  })
  if (!lead) throw new HttpError(404, 'Lead no encontrado o sin acceso')
  return lead
}

export type LeadFilters = {
  campaignId?: string | null
  status?: string | null
  asignadoA?: string | null
  /** Excluye leads en estado final (POSITIVO / NEGATIVO). */
  excludeFinal?: boolean
  /** Vista del asesor: 'pendientes' (bandeja) o 'historial' (atendidos). */
  asesorView?: 'pendientes' | 'historial' | null
}

// Estados finales: no se muestran en la gestión de la campaña.
const FINAL_STATUSES: LEAD_STATUS[] = [LEAD_STATUS.POSITIVO, LEAD_STATUS.NEGATIVO]

const leadInclude = {
  asignadoA: { select: { user_id: true, name: true } },
  sale: { select: { id_sale: true } },
  campaign: { select: { campaign_id: true, name: true } },
} satisfies Prisma.LeadInclude

/**
 * Vista de leads del ASESOR:
 *  - 'pendientes' (bandeja): leads asignados a él y no finales (por atender).
 *    En modo AUTO los obtiene con el botón "Asignarme" (autoasignación).
 *  - 'historial': leads que él procesó y que NO están asignados a otro asesor
 *    (si se reasignan a otro desaparecen; si vuelven a él, reaparecen).
 */
function listAsesorLeads(user: AuthUser, campaignId: string | null, view: 'pendientes' | 'historial') {
  const camp: Prisma.LeadWhereInput = campaignId ? { campaignId } : {}
  const where: Prisma.LeadWhereInput =
    view === 'historial'
      ? {
          ...camp,
          processLogs: { some: { userId: user.userId } },
          OR: [
            { asignadoAId: null },
            { asignadoAId: user.userId, status: { in: FINAL_STATUSES } },
          ],
        }
      : { ...camp, asignadoAId: user.userId, status: { notIn: FINAL_STATUSES } }
  return prisma.lead.findMany({ where, orderBy: { updatedAt: 'desc' }, include: leadInclude })
}

/** Lista leads visibles según rol, con filtros opcionales por campaña, status y asesor. */
export function listLeads(user: AuthUser, filters: LeadFilters) {
  if (user.role === 'ASESOR' && filters.asesorView) {
    return listAsesorLeads(user, filters.campaignId ?? null, filters.asesorView)
  }
  const extra: Prisma.LeadWhereInput = {}
  if (filters.campaignId) extra.campaignId = filters.campaignId
  if (filters.status) extra.status = requireEnum(filters.status, LEAD_STATUS, 'status')
  else if (filters.excludeFinal) extra.status = { notIn: FINAL_STATUSES }
  if (filters.asignadoA) extra.asignadoAId = filters.asignadoA
  return prisma.lead.findMany({
    where: { AND: [getLeadFilter(user), extra] },
    orderBy: { id: 'asc' },
    include: {
      asignadoA: { select: { user_id: true, name: true } },
      sale: { select: { id_sale: true } },
      campaign: { select: { campaign_id: true, name: true } },
    },
  })
}

// Estados no finales que, al procesarse, devuelven el lead al pool para reproceso.
const RETURN_TO_POOL: string[] = [LEAD_STATUS.AGENDADO, LEAD_STATUS.NO_CONTACTO]

/**
 * Procesa (gestiona) un lead: actualiza estado/observaciones, deja rastro en
 * LeadProcessLog y, si queda AGENDADO o NO_CONTACTO, lo devuelve al pool
 * (sin asesor) para que se reprocese junto a los SIN_GESTION.
 */
export async function updateLead(user: AuthUser, id: string, input: Record<string, unknown>) {
  const lead = await getVisibleLead(user, id)

  const status = input.status !== undefined ? requireEnum(input.status, LEAD_STATUS, 'status') : lead.status
  const subStatus =
    input.sub_status !== undefined ? requireEnum(input.sub_status, LEAD_SUBSTATUS, 'sub_status') : lead.sub_status
  const observations = typeof input.observations === 'string' ? input.observations : lead.observations

  const data: Prisma.LeadUpdateInput = { status, sub_status: subStatus }
  if (typeof input.observations === 'string') data.observations = input.observations
  if (typeof input.reason === 'string') data.reason = input.reason
  if (typeof input.name_client === 'string') data.name_client = input.name_client

  if (RETURN_TO_POOL.includes(status)) data.asignadoA = { disconnect: true }

  const [updated] = await prisma.$transaction([
    prisma.lead.update({ where: { id }, data }),
    prisma.leadProcessLog.create({
      data: { leadId: id, userId: user.userId, status, sub_status: subStatus, observations },
    }),
  ])
  return updated
}

/**
 * Autoasignación (modo AUTO): el asesor se asigna el lead más nuevo sin asignar
 * de la campaña. Atómico y a prueba de concurrencia (si otro lo tomó primero,
 * reintenta). El lead sale del pool y pasa a su bandeja "por atender".
 */
export async function selfAssignLead(user: AuthUser, campaignId: string) {
  if (user.role !== 'ASESOR') throw new HttpError(403, 'Solo los asesores pueden autoasignarse leads')
  const campaign = await prisma.campaign.findUnique({
    where: { campaign_id: campaignId },
    select: { leadMode: true },
  })
  if (!campaign) throw new HttpError(404, 'Campaña no encontrada')
  if (campaign.leadMode !== 'AUTO') throw new HttpError(400, 'La campaña no está en modo automático')

  // Solo puede tomar un lead si no tiene ninguno por atender (uno a la vez).
  const pending = await prisma.lead.count({
    where: { campaignId, asignadoAId: user.userId, status: { notIn: FINAL_STATUSES } },
  })
  if (pending > 0) {
    throw new HttpError(409, 'Ya tienes un lead por atender. Termínalo antes de tomar otro.')
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const next = await prisma.lead.findFirst({
      where: { campaignId, asignadoAId: null, status: { notIn: FINAL_STATUSES } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // el más nuevo
      select: { id: true },
    })
    if (!next) throw new HttpError(404, 'No hay leads disponibles para atender en esta campaña')

    // Guardia de concurrencia: solo lo toma si sigue sin asignar.
    const res = await prisma.lead.updateMany({
      where: { id: next.id, asignadoAId: null },
      data: { asignadoAId: user.userId },
    })
    if (res.count === 1) {
      await prisma.leadAssignment.create({
        data: { leadId: next.id, asesorId: user.userId, asignadoPorId: user.userId },
      })
      return prisma.lead.findUnique({ where: { id: next.id }, include: leadInclude })
    }
    // otro asesor lo tomó entre el find y el update → reintentar
  }
  throw new HttpError(409, 'No se pudo asignar el lead, intenta de nuevo')
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
  asesorDni?: unknown
  leadIds?: unknown
  cantidad?: unknown
}

/** Resuelve el asesor por id o por DNI (document_number). */
async function resolveAsesorId(input: AssignLeadsInput): Promise<string> {
  if (typeof input.asesorId === 'string' && input.asesorId) return input.asesorId
  if (typeof input.asesorDni === 'string' && input.asesorDni) {
    const u = await prisma.user.findFirst({
      where: { document_number: input.asesorDni, rol: { name: 'ASESOR' } },
      select: { user_id: true },
    })
    if (!u) throw new HttpError(400, 'No hay un asesor con ese DNI')
    return u.user_id
  }
  throw new HttpError(400, 'Indica asesorId o asesorDni')
}

/**
 * Valida el destinatario de una asignación de leads.
 * - Un SUPERVISOR puede asignarse leads a sí mismo (para atenderlos).
 * - En otro caso el destinatario debe ser ASESOR (de su grupo o cualquier otro).
 */
async function assertAsesorAsignable(user: AuthUser, asesorId: string) {
  if (user.role === 'SUPERVISOR' && asesorId === user.userId) return

  const asesor = await prisma.user.findFirst({
    where: { user_id: asesorId, rol: { name: 'ASESOR' } },
    select: { user_id: true },
  })
  if (!asesor) throw new HttpError(400, 'El destinatario debe ser un usuario ASESOR')
}

/**
 * Asigna leads de una campaña a un asesor (crea historial).
 * Acepta `{ leadIds }` (selección manual) o `{ cantidad }` (N leads sin asignar).
 */
export async function assignLeads(user: AuthUser, input: AssignLeadsInput) {
  const campaignId = requireString(input.campaignId, 'campaignId')
  const asesorId = await resolveAsesorId(input)

  await assertCanAssignInCampaign(user, campaignId)
  await assertAsesorAsignable(user, asesorId)

  let leadIds: string[]
  if (Array.isArray(input.leadIds) && input.leadIds.length > 0) {
    leadIds = input.leadIds.map((v, i) => requireString(v, `leadIds[${i}]`))
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, campaignId },
      select: { id: true },
    })
    if (leads.length !== leadIds.length) {
      throw new HttpError(400, 'Algunos leads no pertenecen a esa campaña')
    }
  } else if (typeof input.cantidad === 'number' && input.cantidad > 0) {
    const libres = await prisma.lead.findMany({
      where: { campaignId, asignadoAId: null },
      take: input.cantidad,
      select: { id: true },
    })
    if (libres.length === 0) throw new HttpError(400, 'No hay leads sin asignar en esa campaña')
    leadIds = libres.map((l) => l.id)
  } else {
    throw new HttpError(400, 'Debes enviar leadIds (array) o cantidad (número > 0)')
  }

  await prisma.$transaction([
    prisma.lead.updateMany({ where: { id: { in: leadIds } }, data: { asignadoAId: asesorId } }),
    prisma.leadAssignment.createMany({
      data: leadIds.map((leadId) => ({ leadId, asesorId, asignadoPorId: user.userId })),
    }),
  ])
  return { assigned: leadIds.length, asesorId }
}
