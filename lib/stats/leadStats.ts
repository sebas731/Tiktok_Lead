import { prisma } from '@/lib/prisma'
import { LEAD_STATUS } from '@/lib/generated/prisma/client'
import { type AuthUser, getLeadFilter, getCampaignFilter } from '@/lib/auth/authorize'

/** Desglose de estados de una campaña (para tarjetas y panel). */
export type CampaignBreakdown = {
  campaignId: string
  sinGestion: number
  noContacto: number
  agendado: number
  positivoSinVenta: number
  negativo: number
}

const FINAL = [LEAD_STATUS.POSITIVO, LEAD_STATUS.NEGATIVO]

/**
 * Cuenta, por campaña y estado, los leads visibles para el usuario. Usa dos
 * groupBy (no una consulta por tarjeta) para no saturar. Respeta la visibilidad
 * por rol (ADMIN todo; SUPERVISOR sus campañas).
 */
export async function campaignBreakdown(user: AuthUser): Promise<Record<string, CampaignBreakdown>> {
  const base = getLeadFilter(user)
  const [byStatus, posSinVenta] = await Promise.all([
    prisma.lead.groupBy({ by: ['campaignId', 'status'], where: base, _count: true }),
    prisma.lead.groupBy({
      by: ['campaignId'],
      where: { AND: [base, { status: LEAD_STATUS.POSITIVO, sale: null }] },
      _count: true,
    }),
  ])

  const map: Record<string, CampaignBreakdown> = {}
  const row = (id: string) =>
    (map[id] ??= { campaignId: id, sinGestion: 0, noContacto: 0, agendado: 0, positivoSinVenta: 0, negativo: 0 })

  for (const r of byStatus) {
    const b = row(r.campaignId)
    if (r.status === LEAD_STATUS.SIN_GESTION) b.sinGestion = r._count
    else if (r.status === LEAD_STATUS.NO_CONTACTO) b.noContacto = r._count
    else if (r.status === LEAD_STATUS.AGENDADO) b.agendado = r._count
    else if (r.status === LEAD_STATUS.NEGATIVO) b.negativo = r._count
  }
  for (const r of posSinVenta) row(r.campaignId).positivoSinVenta = r._count

  return map
}

/** Estadísticas de leads para el ASESOR (pool de sus campañas + su bandeja). */
export type AsesorLeadStats = {
  nuevos3min: number // SIN_GESTION del pool que cayeron en los últimos 3 minutos
  disponibles: number // SIN_GESTION disponibles (sin asesor) en sus campañas
  misPendientes: number // asignados a él, no finales (por atender)
}

export async function asesorLeadStats(user: AuthUser): Promise<AsesorLeadStats> {
  const poolBase = { campaign: getCampaignFilter(user), status: LEAD_STATUS.SIN_GESTION, asignadoAId: null }
  const hace3min = new Date(Date.now() - 3 * 60 * 1000)
  const [nuevos3min, disponibles, misPendientes] = await Promise.all([
    prisma.lead.count({ where: { ...poolBase, createdAt: { gte: hace3min } } }),
    prisma.lead.count({ where: poolBase }),
    prisma.lead.count({ where: { asignadoAId: user.userId, status: { notIn: FINAL } } }),
  ])
  return { nuevos3min, disponibles, misPendientes }
}
