import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma/client'
import { HttpError } from '@/lib/api/response'
import type { AuthUser } from '@/lib/auth/authorize'
import type { ProcessedByAsesorRow } from '@/lib/types'

export type ProcessedFilters = {
  campaignId?: string | null
  desde?: string | null
  hasta?: string | null
  asesorId?: string | null
}

/**
 * Leads procesados agrupados por asesor (desde LeadProcessLog).
 * ADMIN ve todo; SUPERVISOR solo las gestiones de leads de sus campañas.
 */
export async function leadsProcessedByAsesor(user: AuthUser, f: ProcessedFilters): Promise<ProcessedByAsesorRow[]> {
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
  if (f.desde || f.hasta) {
    where.processedAt = {}
    if (f.desde) where.processedAt.gte = new Date(f.desde)
    if (f.hasta) {
      const d = new Date(f.hasta)
      d.setHours(23, 59, 59, 999)
      where.processedAt.lte = d
    }
  }

  const grouped = await prisma.leadProcessLog.groupBy({
    by: ['userId', 'status'],
    where,
    _count: { _all: true },
  })

  const map = new Map<string, ProcessedByAsesorRow>()
  for (const g of grouped) {
    const row = map.get(g.userId) ?? { asesorId: g.userId, asesorName: '', total: 0, byStatus: {} }
    const n = g._count._all
    row.byStatus[g.status] = (row.byStatus[g.status] ?? 0) + n
    row.total += n
    map.set(g.userId, row)
  }

  const ids = [...map.keys()]
  if (ids.length === 0) return []
  const users = await prisma.user.findMany({ where: { user_id: { in: ids } }, select: { user_id: true, name: true } })
  const names = new Map(users.map((u) => [u.user_id, u.name]))
  for (const [id, row] of map) row.asesorName = names.get(id) ?? '—'

  return [...map.values()].sort((a, b) => b.total - a.total)
}
