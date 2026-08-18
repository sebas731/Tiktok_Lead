import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma/client'
import { HttpError } from '@/lib/api/response'
import type { AuthUser } from '@/lib/auth/authorize'
import type { ProcessedByAsesorRow, ProcessedDetailRow } from '@/lib/types'

export type ProcessedFilters = {
  campaignId?: string | null
  desde?: string | null
  hasta?: string | null
  asesorId?: string | null
  status?: string | null
}

const fullName = (u: { name: string; first_last_name?: string | null; second_last_name?: string | null }) =>
  [u.name, u.first_last_name, u.second_last_name].filter(Boolean).join(' ').trim() || u.name

/** Construye el filtro de LeadProcessLog según rol y filtros (scoping común). */
function buildProcessedWhere(user: AuthUser, f: ProcessedFilters): Prisma.LeadProcessLogWhereInput {
  if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
    throw new HttpError(403, 'No tienes permiso para ver este reporte')
  }
  const where: Prisma.LeadProcessLogWhereInput = {}
  const leadWhere: Prisma.LeadWhereInput = {}
  if (user.role === 'SUPERVISOR') {
    leadWhere.campaign = { campaignAssignments: { some: { userId: user.userId } } }
  }
  if (f.campaignId) leadWhere.campaignId = f.campaignId
  if (Object.keys(leadWhere).length > 0) where.lead = leadWhere
  if (f.asesorId) where.userId = f.asesorId
  if (f.status) where.status = f.status as Prisma.LeadProcessLogWhereInput['status']
  if (f.desde || f.hasta) {
    where.processedAt = {}
    // Las fechas del filtro son CALENDARIO de Lima (UTC-5). Se convierten a UTC
    // para no arrastrar leads del día anterior/siguiente por la zona horaria.
    if (f.desde) where.processedAt.gte = limaDayStart(f.desde)
    if (f.hasta) {
      // Fin exclusivo = inicio del día SIGUIENTE en Lima (incluye todo el día "hasta").
      where.processedAt.lt = new Date(limaDayStart(f.hasta).getTime() + 24 * 60 * 60 * 1000)
    }
  }
  return where
}

/** Medianoche (00:00) en Lima (UTC-5) de una fecha 'YYYY-MM-DD', como instante UTC. */
function limaDayStart(dateStr: string): Date {
  return new Date(`${dateStr.slice(0, 10)}T05:00:00.000Z`)
}

/**
 * Leads procesados agrupados por asesor (desde LeadProcessLog).
 * ADMIN ve todo; SUPERVISOR solo las gestiones de leads de sus campañas.
 */
export async function leadsProcessedByAsesor(user: AuthUser, f: ProcessedFilters): Promise<ProcessedByAsesorRow[]> {
  const where = buildProcessedWhere(user, f)

  const grouped = await prisma.leadProcessLog.groupBy({
    by: ['userId', 'status'],
    where,
    _count: { _all: true },
  })

  const map = new Map<string, ProcessedByAsesorRow>()
  for (const g of grouped) {
    const row = map.get(g.userId) ?? { asesorId: g.userId, asesorName: '', asesorDni: '', total: 0, byStatus: {} }
    const n = g._count._all
    row.byStatus[g.status] = (row.byStatus[g.status] ?? 0) + n
    row.total += n
    map.set(g.userId, row)
  }

  const ids = [...map.keys()]
  if (ids.length === 0) return []
  const users = await prisma.user.findMany({
    where: { user_id: { in: ids } },
    select: { user_id: true, name: true, first_last_name: true, second_last_name: true, document_number: true },
  })
  const byId = new Map(users.map((u) => [u.user_id, u]))
  for (const [id, row] of map) {
    const u = byId.get(id)
    row.asesorName = u ? fullName(u) : '—'
    row.asesorDni = u?.document_number ?? '—'
  }

  return [...map.values()].sort((a, b) => b.total - a.total)
}

/**
 * Detalle de gestiones (leads procesados), con lead, campaña y asesor.
 * Si `asesorId` viene, es el detalle de ese asesor; si no, es la vista plana
 * (todas las gestiones filtrables por asesor/estado/campaña/fecha).
 */
export async function processedLeadDetail(user: AuthUser, f: ProcessedFilters): Promise<ProcessedDetailRow[]> {
  const where = buildProcessedWhere(user, f)

  const logs = await prisma.leadProcessLog.findMany({
    where,
    orderBy: { processedAt: 'desc' },
    take: 2000,
    select: {
      id: true,
      userId: true,
      processedAt: true,
      status: true,
      sub_status: true,
      observations: true,
      lead: {
        select: { id: true, client_number: true, reason: true, campaign: { select: { name: true } }, sale: { select: { code: true } } },
      },
      user: { select: { name: true, first_last_name: true, second_last_name: true, document_number: true } },
    },
  })

  // Supervisor de cada asesor (por su grupo), para la columna "Supervisor".
  const asesorIds = [...new Set(logs.map((l) => l.userId))]
  const members = asesorIds.length
    ? await prisma.grupoMember.findMany({
        where: { asesorId: { in: asesorIds } },
        select: { asesorId: true, grupo: { select: { supervisor: { select: { name: true } } } } },
      })
    : []
  const supByAsesor = new Map(members.map((m) => [m.asesorId, m.grupo.supervisor.name]))

  return logs.map((l) => ({
    id: l.id,
    processedAt: l.processedAt.toISOString(),
    status: l.status,
    subStatus: l.sub_status,
    observations: l.observations,
    reason: l.lead.reason,
    leadId: l.lead.id,
    leadNumber: l.lead.client_number,
    saleCode: l.lead.sale?.code ?? null,
    campaignName: l.lead.campaign.name,
    asesorName: fullName(l.user),
    asesorDni: l.user.document_number,
    supervisorName: supByAsesor.get(l.userId) ?? '—',
  }))
}
