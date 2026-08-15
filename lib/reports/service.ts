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
    if (f.desde) where.processedAt.gte = new Date(f.desde)
    if (f.hasta) {
      const d = new Date(f.hasta)
      d.setHours(23, 59, 59, 999)
      where.processedAt.lte = d
    }
  }
  return where
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
    take: 500,
    select: {
      id: true,
      processedAt: true,
      status: true,
      sub_status: true,
      observations: true,
      lead: { select: { client_number: true, campaign: { select: { name: true } } } },
      user: { select: { name: true, first_last_name: true, second_last_name: true, document_number: true } },
    },
  })

  return logs.map((l) => ({
    id: l.id,
    processedAt: l.processedAt.toISOString(),
    status: l.status,
    subStatus: l.sub_status,
    observations: l.observations,
    leadNumber: l.lead.client_number,
    campaignName: l.lead.campaign.name,
    asesorName: fullName(l.user),
    asesorDni: l.user.document_number,
  }))
}
