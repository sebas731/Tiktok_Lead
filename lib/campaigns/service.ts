import { prisma } from '@/lib/prisma'
import { Prisma, CampaignSource, SheetAccessMode, LeadMode, LEAD_STATUS } from '@/lib/generated/prisma/client'
import { HttpError, requireEnum, requireString } from '@/lib/api/response'
import { type AuthUser, getCampaignFilter } from '@/lib/auth/authorize'

/**
 * Lista campañas visibles según el rol, con conteo de leads.
 * Para el ASESOR el conteo son SOLO sus leads sin gestionar (SIN_GESTION).
 */
export function listCampaigns(user: AuthUser) {
  // Para el ASESOR el conteo son sus leads por atender: los asignados a él y,
  // en campañas de modo AUTO, también los leads sin asignar (pool autoservicio).
  const leadSelect =
    user.role === 'ASESOR'
      ? {
          where: {
            status: { notIn: [LEAD_STATUS.POSITIVO, LEAD_STATUS.NEGATIVO] },
            OR: [
              { asignadoAId: user.userId },
              { campaign: { leadMode: LeadMode.AUTO }, asignadoAId: null },
            ],
          } satisfies Prisma.LeadWhereInput,
        }
      : true
  return prisma.campaign.findMany({
    where: getCampaignFilter(user),
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { lead: leadSelect } } },
  })
}

export async function createCampaign(input: Record<string, unknown>) {
  const source = requireEnum(input.source ?? 'TIKTOK', CampaignSource, 'source')
  const data: Prisma.CampaignCreateInput = {
    source,
    name: requireString(input.name, 'name'),
  }
  if (typeof input.denomination === 'string') data.denomination = input.denomination
  if (typeof input.leadMode === 'string') data.leadMode = requireEnum(input.leadMode, LeadMode, 'leadMode')
  if (typeof input.autoSync === 'boolean') data.autoSync = input.autoSync

  // Validación por origen (a nivel de aplicación, no de base).
  if (source === 'TIKTOK') {
    data.tiktokCampaignId = requireString(input.tiktokCampaignId, 'tiktokCampaignId')
    const keyId = requireString(input.keyId, 'keyId')
    // El Advertiser ID es la Key: se deriva de ella, no se pide a mano (evita inconsistencias).
    const key = await prisma.key.findUnique({ where: { id: keyId }, select: { advertiserId: true } })
    if (!key) throw new HttpError(400, 'La Key seleccionada no existe')
    data.tiktokAdvertiserId = key.advertiserId
    data.key = { connect: { id: keyId } }
  } else {
    // Una pestaña = una campaña: se exige la URL y la pestaña (gid) seleccionada.
    data.excelUrl = requireString(input.excelUrl, 'excelUrl')
    data.excelGid = requireString(input.excelGid, 'excelGid')
    if (typeof input.excelSheetName === 'string') data.excelSheetName = input.excelSheetName
    data.sheetAccessMode = requireEnum(input.sheetAccessMode ?? 'PUBLIC_CSV', SheetAccessMode, 'sheetAccessMode')
  }
  return prisma.campaign.create({ data })
}

/**
 * Edita una campaña. NO permite cambiar `source` (ver PATCH route): cambiar el
 * origen alteraría el significado de los leads ya importados/sincronizados.
 * Persiste name/denomination/status + los campos del origen actual.
 */
export async function updateCampaign(id: string, input: Record<string, unknown>) {
  const campaign = await prisma.campaign.findUnique({
    where: { campaign_id: id },
    select: { source: true },
  })
  if (!campaign) throw new HttpError(404, 'Campaña no encontrada')

  const data: Prisma.CampaignUpdateInput = {}
  if (typeof input.name === 'string') data.name = input.name
  if (typeof input.denomination === 'string') data.denomination = input.denomination
  if (typeof input.status === 'boolean') data.status = input.status
  if (typeof input.leadMode === 'string') data.leadMode = requireEnum(input.leadMode, LeadMode, 'leadMode')
  if (typeof input.autoSync === 'boolean') data.autoSync = input.autoSync

  if (campaign.source === 'TIKTOK') {
    if (typeof input.tiktokCampaignId === 'string') data.tiktokCampaignId = input.tiktokCampaignId
    if (typeof input.keyId === 'string' && input.keyId) {
      const key = await prisma.key.findUnique({ where: { id: input.keyId }, select: { advertiserId: true } })
      if (!key) throw new HttpError(400, 'La Key seleccionada no existe')
      data.key = { connect: { id: input.keyId } }
      // El Advertiser ID se sincroniza con el de la Key.
      data.tiktokAdvertiserId = key.advertiserId
    }
  } else {
    if (typeof input.excelUrl === 'string') data.excelUrl = input.excelUrl
    if (typeof input.excelGid === 'string') data.excelGid = input.excelGid
    if (typeof input.excelSheetName === 'string') data.excelSheetName = input.excelSheetName
    if (typeof input.sheetAccessMode === 'string') {
      data.sheetAccessMode = requireEnum(input.sheetAccessMode, SheetAccessMode, 'sheetAccessMode')
    }
  }
  return prisma.campaign.update({ where: { campaign_id: id }, data })
}

/**
 * Elimina una campaña y sus datos dependientes (leads, asignaciones, logs).
 * Se bloquea si la campaña tiene ventas registradas (no se pueden perder).
 */
export async function deleteCampaign(id: string) {
  const campaign = await prisma.campaign.findUnique({ where: { campaign_id: id }, select: { campaign_id: true } })
  if (!campaign) throw new HttpError(404, 'Campaña no encontrada')

  const sales = await prisma.sale.count({ where: { campaingId: id } })
  if (sales > 0) {
    throw new HttpError(409, `No se puede eliminar: la campaña tiene ${sales} venta(s) registrada(s).`)
  }

  await prisma.$transaction([
    prisma.leadProcessLog.deleteMany({ where: { lead: { campaignId: id } } }),
    prisma.leadAssignment.deleteMany({ where: { lead: { campaignId: id } } }),
    prisma.lead.deleteMany({ where: { campaignId: id } }),
    prisma.campaignAssignment.deleteMany({ where: { campaignId: id } }),
    prisma.campaign.delete({ where: { campaign_id: id } }),
  ])
  return { deleted: true }
}

const ASSIGN_INCLUDE = {
  user: { select: { user_id: true, name: true, document_number: true, rol: { select: { name: true } } } },
} satisfies Prisma.CampaignAssignmentInclude

/** Usuarios actualmente asignados a la campaña. */
export function listCampaignUsers(campaignId: string) {
  return prisma.campaignAssignment.findMany({ where: { campaignId }, include: ASSIGN_INCLUDE })
}

/**
 * Asigna un usuario (SUPERVISOR, BACK o ASESOR) a una campaña. El rol define
 * sus permisos dentro de la campaña. Idempotente.
 */
export async function assignUserToCampaign(campaignId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { user_id: userId, rol: { name: { in: ['SUPERVISOR', 'BACK', 'ASESOR'] } } },
    select: { user_id: true },
  })
  if (!user) throw new HttpError(400, 'El usuario debe ser SUPERVISOR, BACK o ASESOR')
  await prisma.campaignAssignment.upsert({
    where: { campaignId_userId: { campaignId, userId } },
    create: { campaignId, userId },
    update: {},
  })
  return listCampaignUsers(campaignId)
}

/** Quita un usuario de la campaña. */
export async function removeCampaignUser(campaignId: string, userId: string) {
  await prisma.campaignAssignment.deleteMany({ where: { campaignId, userId } })
  return { removed: true }
}
