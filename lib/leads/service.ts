import { prisma } from '@/lib/prisma'
import { Prisma, LEAD_STATUS, LEAD_SUBSTATUS } from '@/lib/generated/prisma/client'
import { HttpError, requireEnum, requireString } from '@/lib/api/response'
import { type AuthUser, getLeadFilter } from '@/lib/auth/authorize'
import { writeLeadStatusToSheet } from '@/lib/services/googleSheets'
import { STATUS_LABELS, SUBSTATUS_LABELS } from '@/lib/constants/leads'

/** Devuelve el lead si es visible para el usuario; si no, lanza 404. */
export async function getVisibleLead(user: AuthUser, id: string) {
  const lead = await prisma.lead.findFirst({
    where: { AND: [getLeadFilter(user), { id }] },
  })
  if (!lead) throw new HttpError(404, 'Lead no encontrado o sin acceso')
  return lead
}

/**
 * Lead que el usuario puede GESTIONAR (editar).
 * - ADMIN / SUPERVISOR / BACK: cualquier lead dentro de su visibilidad normal
 *   (el admin/supervisor puede corregir cualquier lead de sus campañas).
 * - ASESOR: el lead que tiene asignado, o uno de sus ÚLTIMOS 5 del historial
 *   (mismo criterio y orden que la vista de historial, para no desincronizar).
 */
async function getEditableLead(user: AuthUser, id: string) {
  if (user.role === 'ASESOR') {
    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) throw new HttpError(404, 'Lead no encontrado')
    if (lead.asignadoAId === user.userId) return lead
    const recuperables = await prisma.lead.findMany({
      where: asesorHistorialWhere(user.userId, lead.campaignId),
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true },
    })
    if (recuperables.some((l) => l.id === id)) return lead
    throw new HttpError(409, 'Solo puedes corregir el lead que tienes asignado o tus últimos 5 gestionados.')
  }
  const lead = await prisma.lead.findFirst({ where: { AND: [getLeadFilter(user), { id }] } })
  if (!lead) {
    throw new HttpError(409, 'Este lead ya no está disponible para ti.')
  }
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
/**
 * Filtro del HISTORIAL del asesor: leads que él procesó y que no están asignados
 * a otro (sin asesor, o suyos y finales). Se usa tanto para listar el historial
 * como para validar qué puede recuperar/corregir (mismo criterio → sin desfases).
 */
function asesorHistorialWhere(userId: string, campaignId: string | null): Prisma.LeadWhereInput {
  return {
    ...(campaignId ? { campaignId } : {}),
    processLogs: { some: { userId } },
    OR: [
      { asignadoAId: null },
      { asignadoAId: userId, status: { in: FINAL_STATUSES } },
    ],
  }
}

function listAsesorLeads(user: AuthUser, campaignId: string | null, view: 'pendientes' | 'historial') {
  const where: Prisma.LeadWhereInput =
    view === 'historial'
      ? asesorHistorialWhere(user.userId, campaignId)
      : { ...(campaignId ? { campaignId } : {}), asignadoAId: user.userId, status: { notIn: FINAL_STATUSES } }
  return prisma.lead.findMany({ where, orderBy: { updatedAt: 'desc' }, include: leadInclude })
}

/** Lista leads visibles según rol, con filtros opcionales por campaña, status y asesor. */
export async function listLeads(user: AuthUser, filters: LeadFilters) {
  // Antes de listar, suelta los AGENDADO vencidos: así dejan la bandeja del asesor
  // y vuelven al pool automáticamente (sin depender de que alguien los tome).
  await releaseExpiredAgendados()
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
    orderBy: { createdAt: 'asc' }, // orden de creación/caída (los más viejos primero)
    include: {
      asignadoA: { select: { user_id: true, name: true, document_number:true,first_last_name:true,second_last_name:true} },
      sale: { select: { id_sale: true } },
      campaign: { select: { campaign_id: true, name: true } },
      // Última gestión: quién procesó el lead y lo dejó en el estado actual.
      processLogs: {
        orderBy: { processedAt: 'desc' },
        take: 1,
        select: {
          processedAt: true,
          user: { select: { user_id: true, name: true, first_last_name: true, second_last_name: true, document_number: true } },
        },
      },
    },
  })
}

const HOUR = 60 * 60 * 1000

/**
 * Suelta los AGENDADO cuya reserva de 24 h ya venció (o los antiguos sin reserva):
 * los DESASIGNA para que dejen la bandeja del asesor y vuelvan al pool. Antes esto
 * era pasivo (solo entraban al pool) y por eso seguían apareciendo en la lista del
 * asesor. Idempotente y barato (updateMany, normalmente 0 filas). Devuelve cuántos
 * liberó.
 */
export async function releaseExpiredAgendados(): Promise<number> {
  const res = await prisma.lead.updateMany({
    where: {
      status: LEAD_STATUS.AGENDADO,
      asignadoAId: { not: null },
      OR: [{ reservedUntil: null }, { reservedUntil: { lt: new Date() } }],
    },
    data: { asignadoAId: null, reservedUntil: null },
  })
  return res.count
}

/**
 * Leads que se pueden tomar del pool ahora mismo:
 *  - no finales,
 *  - sin reserva/enfriamiento vigente (reservedUntil vencido o nulo),
 *  - sin asesor, o AGENDADO cuya reserva de 24h ya venció.
 *
 * Si `allowNoContacto` es true (campaña que lo habilita), los leads NO_CONTACTO
 * que YA volvieron al pool (sin asesor) entran aunque su enfriamiento de 5h siga
 * vigente. Nunca se toma un NO_CONTACTO que sigue asignado a un asesor: si aún lo
 * tiene en mano (lo está tipificando), no debe poder jalarlo otro.
 */
function availableLeadWhere(campaignId: string, now: Date, allowNoContacto = false): Prisma.LeadWhereInput {
  const reservaVencida: Prisma.LeadWhereInput[] = [{ reservedUntil: null }, { reservedUntil: { lte: now } }]
  const asignable: Prisma.LeadWhereInput[] = [{ asignadoAId: null }, { status: LEAD_STATUS.AGENDADO }]
  if (allowNoContacto) {
    // Solo se salta el ENFRIAMIENTO (reservedUntil) de los NO_CONTACTO ya
    // liberados al pool; NO se salta la asignación (los que están asignados,
    // porque un asesor los tiene en mano, quedan fuera vía `asignable`).
    reservaVencida.push({ status: LEAD_STATUS.NO_CONTACTO })
  }
  return {
    campaignId,
    status: { notIn: FINAL_STATUSES },
    AND: [{ OR: reservaVencida }, { OR: asignable }],
  }
}

/** Cantidad de leads disponibles (pool) para tomar en una campaña. */
export async function countAvailableLeads(campaignId: string): Promise<number> {
  const campaign = await prisma.campaign.findUnique({
    where: { campaign_id: campaignId },
    select: { allowNoContactoPull: true },
  })
  return prisma.lead.count({ where: availableLeadWhere(campaignId, new Date(), campaign?.allowNoContactoPull ?? false) })
}

/**
 * Procesa (gestiona) un lead. AGENDADO lo reserva 24h para su asesor (queda
 * asignado); NO_CONTACTO lo devuelve al pool con 5h de enfriamiento. Deja
 * rastro en LeadProcessLog.
 */
export async function updateLead(user: AuthUser, id: string, input: Record<string, unknown>) {
  const lead = await getEditableLead(user, id)

  const status = input.status !== undefined ? requireEnum(input.status, LEAD_STATUS, 'status') : lead.status
  const subStatus =
    input.sub_status !== undefined ? requireEnum(input.sub_status, LEAD_SUBSTATUS, 'sub_status') : lead.sub_status
  const observations = typeof input.observations === 'string' ? input.observations : lead.observations

  const data: Prisma.LeadUpdateInput = { status, sub_status: subStatus }
  if (typeof input.observations === 'string') data.observations = input.observations
  if (typeof input.reason === 'string') data.reason = input.reason
  if (typeof input.name_client === 'string') data.name_client = input.name_client

  if (status === LEAD_STATUS.NO_CONTACTO) {
    // Vuelve al pool, pero con 5h de enfriamiento (no se reasigna en ese lapso).
    data.asignadoA = { disconnect: true }
    data.reservedUntil = new Date(Date.now() + 5 * HOUR)
  } else {
    // Cualquier otro estado mantiene el lead atribuido al asesor que lo gestionó
    // (evita que un lead reeditado desde el pool quede AGENDADO/POSITIVO sin asesor).
    if (user.role === 'ASESOR' && lead.asignadoAId !== user.userId) {
      data.asignadoA = { connect: { user_id: user.userId } }
    }
    // AGENDADO se reserva 24h para su asesor; el resto no reserva.
    data.reservedUntil = status === LEAD_STATUS.AGENDADO ? new Date(Date.now() + 24 * HOUR) : null
  }

  const [updated] = await prisma.$transaction([
    prisma.lead.update({ where: { id }, data }),
    prisma.leadProcessLog.create({
      data: { leadId: id, userId: user.userId, status, sub_status: subStatus, observations },
    }),
  ])

  // Write-back al Sheet en SEGUNDO PLANO: no se espera ni puede romper/retrasar
  // la gestión. Si el Sheet no es escribible o falla, el lead ya quedó guardado.
  void syncLeadStatusToSheet(lead.campaignId, lead.client_number, status, subStatus)

  return updated
}

/** Escribe estado/sub-estado en el Sheet (best-effort). Nunca lanza. */
async function syncLeadStatusToSheet(campaignId: string, clientNumber: string, status: string, subStatus: string) {
  try {
    const camp = await prisma.campaign.findUnique({
      where: { campaign_id: campaignId },
      select: { source: true, sheetAccessMode: true, excelUrl: true, excelGid: true, excelSheetName: true },
    })
    if (camp?.source !== 'EXCEL' || camp.sheetAccessMode !== 'SERVICE_ACCOUNT' || !camp.excelUrl || !camp.excelGid) return
    await writeLeadStatusToSheet({
      url: camp.excelUrl,
      mode: 'SERVICE_ACCOUNT',
      gid: camp.excelGid,
      sheetTitle: camp.excelSheetName,
      clientNumber,
      estado: STATUS_LABELS[status] ?? status,
      subEstado: SUBSTATUS_LABELS[subStatus] ?? subStatus,
    })
  } catch {
    // Silencioso: el Sheet no debe afectar el funcionamiento del sistema.
  }
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
    select: { leadMode: true, allowNoContactoPull: true },
  })
  if (!campaign) throw new HttpError(404, 'Campaña no encontrada')
  if (campaign.leadMode !== 'AUTO') throw new HttpError(400, 'La campaña no está en modo automático')

  // Solo se bloquea si tiene un lead SIN GESTIONAR (un AGENDADO reservado no bloquea).
  const pending = await prisma.lead.count({
    where: { campaignId, asignadoAId: user.userId, status: LEAD_STATUS.SIN_GESTION },
  })
  if (pending > 0) {
    throw new HttpError(409, 'Ya tienes un lead sin gestionar. Termínalo antes de tomar otro.')
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const now = new Date()
    const pool = availableLeadWhere(campaignId, now, campaign.allowNoContactoPull)
    // FIFO: los leads más VIEJOS sin gestión tienen prioridad (no se enfrían).
    const order = [{ createdAt: 'asc' as const }, { id: 'asc' as const }]
    // Prioridad: primero SIN_GESTION (leads frescos); si no hay, cualquiera disponible.
    let next = await prisma.lead.findFirst({
      where: { ...pool, status: LEAD_STATUS.SIN_GESTION },
      orderBy: order,
      select: { id: true, asignadoAId: true },
    })
    if (!next) {
      next = await prisma.lead.findFirst({
        where: {
          ...pool,
          // Anti-bucle: aunque la campaña permita jalar NO_CONTACTO, no le devolvemos
          // al asesor un lead que ÉL MISMO dejó en NO_CONTACTO (evita el mismo número
          // una y otra vez). Otros asesores sí pueden tomarlo.
          NOT: { status: LEAD_STATUS.NO_CONTACTO, processLogs: { some: { userId: user.userId } } },
        },
        orderBy: order,
        select: { id: true, asignadoAId: true },
      })
    }
    if (!next) throw new HttpError(404, 'No hay leads disponibles para atender en esta campaña')

    // Guardia de concurrencia: solo lo toma si sigue en el estado que vimos.
    const res = await prisma.lead.updateMany({
      where: { id: next.id, asignadoAId: next.asignadoAId },
      data: { asignadoAId: user.userId, reservedUntil: null },
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
    // Pool con enfriamiento/reserva respetados. Prioridad: primero SIN_GESTION.
    const now = new Date()
    const pool = availableLeadWhere(campaignId, now)
    // FIFO: los leads más VIEJOS sin gestión tienen prioridad (no se enfrían).
    const order = [{ createdAt: 'asc' as const }, { id: 'asc' as const }]
    const frescos = await prisma.lead.findMany({
      where: { ...pool, status: LEAD_STATUS.SIN_GESTION },
      take: input.cantidad,
      orderBy: order,
      select: { id: true },
    })
    leadIds = frescos.map((l) => l.id)
    if (leadIds.length < input.cantidad) {
      const resto = await prisma.lead.findMany({
        where: { ...pool, id: { notIn: leadIds } },
        take: input.cantidad - leadIds.length,
        orderBy: order,
        select: { id: true },
      })
      leadIds = leadIds.concat(resto.map((l) => l.id))
    }
    if (leadIds.length === 0) {
      throw new HttpError(400, 'No hay leads disponibles (revisa reservas de agendados y enfriamientos de no-contacto)')
    }
  } else {
    throw new HttpError(400, 'Debes enviar leadIds (array) o cantidad (número > 0)')
  }

  await prisma.$transaction([
    prisma.lead.updateMany({ where: { id: { in: leadIds } }, data: { asignadoAId: asesorId, reservedUntil: null } }),
    prisma.leadAssignment.createMany({
      data: leadIds.map((leadId) => ({ leadId, asesorId, asignadoPorId: user.userId })),
    }),
  ])
  return { assigned: leadIds.length, asesorId }
}

/**
 * Recupera leads ASIGNADOS que siguen SIN_GESTION: los desasigna y los devuelve
 * al pool (sin asesor y sin reserva), para que otros puedan tomarlos. Solo actúa
 * sobre leads de la campaña que estén asignados y sin gestionar (los ya
 * gestionados no se tocan). ADMIN, o SUPERVISOR con la campaña asignada.
 */
export async function recoverLeads(user: AuthUser, input: { campaignId?: unknown; leadIds?: unknown }) {
  const campaignId = requireString(input.campaignId, 'campaignId')
  await assertCanAssignInCampaign(user, campaignId)

  if (!Array.isArray(input.leadIds) || input.leadIds.length === 0) {
    throw new HttpError(400, 'Debes enviar leadIds (array) con al menos un lead')
  }
  const leadIds = input.leadIds.map((v, i) => requireString(v, `leadIds[${i}]`))

  const res = await prisma.lead.updateMany({
    where: {
      id: { in: leadIds },
      campaignId,
      status: LEAD_STATUS.SIN_GESTION,
      asignadoAId: { not: null },
    },
    data: { asignadoAId: null, reservedUntil: null },
  })
  return { recovered: res.count }
}
