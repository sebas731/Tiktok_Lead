import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma/client'
import { HttpError, requireString } from '@/lib/api/response'
import { type AuthUser, campaignWhereForUser } from '@/lib/auth/authorize'

/** Lista campañas visibles según el rol, con conteo de leads. */
export function listCampaigns(user: AuthUser) {
  return prisma.campaign.findMany({
    where: campaignWhereForUser(user),
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { lead: true } } },
  })
}

export async function createCampaign(input: Record<string, unknown>) {
  const data: Prisma.CampaignCreateInput = {
    name: requireString(input.name, 'name'),
    tiktokCampaignId: requireString(input.tiktokCampaignId, 'tiktokCampaignId'),
    tiktokAdvertiserId: requireString(input.tiktokAdvertiserId, 'tiktokAdvertiserId'),
    key: { connect: { id: requireString(input.keyId, 'keyId') } },
  }
  if (typeof input.denomination === 'string') data.denomination = input.denomination
  return prisma.campaign.create({ data })
}

export function updateCampaign(id: string, input: Record<string, unknown>) {
  const data: Prisma.CampaignUpdateInput = {}
  if (typeof input.name === 'string') data.name = input.name
  if (typeof input.denomination === 'string') data.denomination = input.denomination
  if (typeof input.status === 'boolean') data.status = input.status
  return prisma.campaign.update({ where: { campaign_id: id }, data })
}

/**
 * Asigna usuarios (deben ser SUPERVISOR o BACK) a una campaña.
 * Idempotente: ignora los que ya estaban asignados.
 */
export async function assignUsersToCampaign(campaignId: string, userIds: unknown) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new HttpError(400, 'Debes enviar userIds (array no vacío)')
  }
  const ids = userIds.map((v, i) => requireString(v, `userIds[${i}]`))

  const valid = await prisma.user.findMany({
    where: { user_id: { in: ids }, rol: { name: { in: ['SUPERVISOR', 'BACK'] } } },
    select: { user_id: true },
  })
  if (valid.length !== ids.length) {
    throw new HttpError(400, 'Solo se pueden asignar usuarios SUPERVISOR o BACK')
  }

  await prisma.campaignAssignment.createMany({
    data: ids.map((userId) => ({ campaignId, userId })),
    skipDuplicates: true,
  })
  return prisma.campaignAssignment.findMany({
    where: { campaignId },
    include: { user: { select: { user_id: true, name: true, rol: { select: { name: true } } } } },
  })
}
