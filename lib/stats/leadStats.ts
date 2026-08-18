import { prisma } from '@/lib/prisma'
import { LEAD_STATUS } from '@/lib/generated/prisma/client'
import { type AuthUser, getLeadFilter, getCampaignFilter } from '@/lib/auth/authorize'

/** Desglose de estados de una campaña (para tarjetas y panel). */
export type CampaignBreakdown = {
  campaignId: string
  sinGestion: number
  noContacto: number
  agendado: number
  positivo: number // total en POSITIVO (con y sin venta)
  positivoSinVenta: number
  negativo: number
  nuevos5min: number // leads creados en los últimos 5 minutos
  hoy: number // leads creados HOY (horario de Lima)
  total: number
}

const FINAL = [LEAD_STATUS.POSITIVO, LEAD_STATUS.NEGATIVO]

// Perú no tiene horario de verano: zona fija UTC-5.
const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000

/** Instante UTC de la medianoche de HOY en Lima. */
function limaTodayStartUtc(): Date {
  const t = new Date(Date.now() - LIMA_OFFSET_MS) // desplazado a "reloj Lima"
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) + LIMA_OFFSET_MS)
}

/**
 * Cuenta, por campaña y estado, los leads visibles para el usuario. Usa pocos
 * groupBy (no una consulta por tarjeta) para no saturar. Respeta la visibilidad
 * por rol (ADMIN todo; SUPERVISOR sus campañas).
 */
export async function campaignBreakdown(user: AuthUser): Promise<Record<string, CampaignBreakdown>> {
  const base = getLeadFilter(user)
  const hace5min = new Date(Date.now() - 5 * 60 * 1000)
  const inicioHoy = limaTodayStartUtc()
  const [byStatus, posSinVenta, nuevos, hoy] = await Promise.all([
    prisma.lead.groupBy({ by: ['campaignId', 'status'], where: base, _count: true }),
    prisma.lead.groupBy({
      by: ['campaignId'],
      where: { AND: [base, { status: LEAD_STATUS.POSITIVO, sale: null }] },
      _count: true,
    }),
    prisma.lead.groupBy({
      by: ['campaignId'],
      where: { AND: [base, { createdAt: { gte: hace5min } }] },
      _count: true,
    }),
    prisma.lead.groupBy({
      by: ['campaignId'],
      where: { AND: [base, { createdAt: { gte: inicioHoy } }] },
      _count: true,
    }),
  ])

  const map: Record<string, CampaignBreakdown> = {}
  const row = (id: string) =>
    (map[id] ??= {
      campaignId: id, sinGestion: 0, noContacto: 0, agendado: 0,
      positivo: 0, positivoSinVenta: 0, negativo: 0, nuevos5min: 0, hoy: 0, total: 0,
    })

  for (const r of byStatus) {
    const b = row(r.campaignId)
    if (r.status === LEAD_STATUS.SIN_GESTION) b.sinGestion = r._count
    else if (r.status === LEAD_STATUS.NO_CONTACTO) b.noContacto = r._count
    else if (r.status === LEAD_STATUS.AGENDADO) b.agendado = r._count
    else if (r.status === LEAD_STATUS.POSITIVO) b.positivo = r._count
    else if (r.status === LEAD_STATUS.NEGATIVO) b.negativo = r._count
    b.total += r._count
  }
  for (const r of posSinVenta) row(r.campaignId).positivoSinVenta = r._count
  for (const r of nuevos) row(r.campaignId).nuevos5min = r._count
  for (const r of hoy) row(r.campaignId).hoy = r._count

  return map
}

/** Estadísticas de leads para el ASESOR (pool de sus campañas + su bandeja). */
export type AsesorLeadStats = {
  nuevos3min: number // SIN_GESTION del pool que cayeron en los últimos 3 minutos
  disponibles: number // SIN_GESTION disponibles (sin asesor) en sus campañas
  misPendientes: number // asignados a él, no finales (por atender)
}

/** Fila del detalle de leads (para el panel del supervisor/admin). */
export type LeadDetailRow = {
  id: string
  client_number: string
  status: string
  sub_status: string
  createdAt: string
  campaignName: string
  asesorName: string | null
}

export type LeadDetailFilters = {
  page?: number
  status?: string | null
  campaignId?: string | null
  order?: 'asc' | 'desc' // por createdAt (asc = más viejos primero / orden de caída)
}

const PAGE_SIZE = 25

/**
 * Listado detallado de leads (paginado) para consulta del supervisor/admin,
 * ordenado por createdAt. Bounded (25 por página) para no saturar.
 */
export async function leadDetail(user: AuthUser, f: LeadDetailFilters) {
  const page = Math.max(1, f.page ?? 1)
  const where = {
    AND: [
      getLeadFilter(user),
      f.campaignId ? { campaignId: f.campaignId } : {},
      f.status ? { status: f.status as LEAD_STATUS } : {},
    ],
  }
  const [rows, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: f.order === 'desc' ? 'desc' : 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, client_number: true, status: true, sub_status: true, createdAt: true,
        campaign: { select: { name: true } },
        asignadoA: { select: { name: true, first_last_name: true } },
      },
    }),
    prisma.lead.count({ where }),
  ])
  const mapped: LeadDetailRow[] = rows.map((r) => ({
    id: r.id,
    client_number: r.client_number,
    status: r.status,
    sub_status: r.sub_status,
    createdAt: r.createdAt.toISOString(),
    campaignName: r.campaign?.name ?? '—',
    asesorName: r.asignadoA ? `${r.asignadoA.name} ${r.asignadoA.first_last_name}`.trim() : null,
  }))
  return { rows: mapped, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
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
