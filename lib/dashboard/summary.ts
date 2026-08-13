import { prisma } from '@/lib/prisma'
import { LEAD_STATUS } from '@/lib/generated/prisma/client'
import {
  type AuthUser,
  getCampaignFilter,
  getLeadFilter,
} from '@/lib/auth/authorize'

export type SummaryCard = { label: string; value: number }

/** Métricas del inicio, distintas según el rol. */
export async function getSummary(user: AuthUser): Promise<SummaryCard[]> {
  if (user.role === 'ADMIN') {
    const [campaigns, leads, users] = await Promise.all([
      prisma.campaign.count(),
      prisma.lead.count(),
      prisma.user.count(),
    ])
    return [
      { label: 'Campañas', value: campaigns },
      { label: 'Leads', value: leads },
      { label: 'Usuarios', value: users },
    ]
  }

  if (user.role === 'SUPERVISOR') {
    const [campaigns, porGestionar] = await Promise.all([
      prisma.campaign.count({ where: getCampaignFilter(user) }),
      prisma.lead.count({
        where: {
          AND: [
            getLeadFilter(user),
            { status: { notIn: [LEAD_STATUS.POSITIVO, LEAD_STATUS.NEGATIVO] } },
          ],
        },
      }),
    ])
    return [
      { label: 'Mis campañas', value: campaigns },
      { label: 'Leads por gestionar', value: porGestionar },
    ]
  }

  if (user.role === 'ASESOR') {
    const pendientes = await prisma.lead.count({
      where: {
        AND: [
          getLeadFilter(user),
          { status: { notIn: [LEAD_STATUS.POSITIVO, LEAD_STATUS.NEGATIVO] } },
        ],
      },
    })
    return [{ label: 'Mis leads pendientes', value: pendientes }]
  }

  // BACK: su leadWhere ya restringe a POSITIVO en sus campañas asignadas.
  const ventas = await prisma.lead.count({ where: getLeadFilter(user) })
  return [{ label: 'Ventas por revisar', value: ventas }]
}
