import { prisma } from '@/lib/prisma'
import { Prisma, SaleStatus, LEAD_STATUS } from '@/lib/generated/prisma/client'
import { HttpError, requireString } from '@/lib/api/response'
import { type AuthUser, getSaleFilter, getGroupAsesorIds } from '@/lib/auth/authorize'
import { buildClientCreate, buildClientUpdate, pickFields, SALE_ADVISOR_FIELDS, SALE_BACK_FIELDS } from './fields'

const listInclude = {
  client: { select: { titular_name: true, last_names: true, document_number: true } },
  campaign: { select: { campaign_id: true, name: true } },
  advisor: { select: { user_id: true, name: true } },
  managerAdvisor: { select: { user_id: true, name: true } },
  sede: { select: { sede_id: true, code: true, name: true } },
  backOffice: { select: { user_id: true, name: true } },
} satisfies Prisma.SaleInclude

const detailInclude = {
  ...listInclude,
  client: true,
  sale_details: true,
  installation: true,
} satisfies Prisma.SaleInclude

export type SaleFilters = {
  sedeId?: string | null
  campaignId?: string | null
  reason?: string | null
  advisorId?: string | null
  fechaDesde?: string | null
  fechaHasta?: string | null
  /** Ámbito del supervisor: 'sede' (todo), 'grupo' (su grupo) o 'propias'. */
  scope?: string | null
}

export async function listSales(user: AuthUser, f: SaleFilters) {
  const extra: Prisma.SaleWhereInput = {}
  if (f.sedeId) extra.sedeId = f.sedeId
  if (f.campaignId) extra.campaingId = f.campaignId
  if (f.advisorId) extra.advisorId = f.advisorId

  // Filtro de ámbito para el supervisor (dentro de su sede).
  if (user.role === 'SUPERVISOR' && f.scope && f.scope !== 'sede') {
    if (f.scope === 'propias') {
      extra.advisorId = user.userId
    } else if (f.scope === 'grupo') {
      const asesorIds = await getGroupAsesorIds(user)
      extra.advisorId = { in: [user.userId, ...asesorIds] }
    }
  }
  if (f.reason && (Object.values(SaleStatus) as string[]).includes(f.reason)) {
    extra.reason = f.reason as SaleStatus
  }
  if (f.fechaDesde || f.fechaHasta) {
    extra.sale_date = {}
    if (f.fechaDesde) extra.sale_date.gte = new Date(f.fechaDesde)
    if (f.fechaHasta) extra.sale_date.lte = new Date(f.fechaHasta)
  }
  return prisma.sale.findMany({
    where: { AND: [await getSaleFilter(user), extra] },
    orderBy: { createdAt: 'desc' },
    include: listInclude,
  })
}

/** Devuelve la venta visible para el usuario, o lanza 404. */
export async function getVisibleSale(user: AuthUser, id: string) {
  const sale = await prisma.sale.findFirst({
    where: { AND: [await getSaleFilter(user), { id_sale: id }] },
  })
  if (!sale) throw new HttpError(404, 'Venta no encontrada o sin acceso')
  return sale
}

export async function getSaleDetail(user: AuthUser, id: string) {
  await getVisibleSale(user, id)
  return prisma.sale.findUnique({ where: { id_sale: id }, include: detailInclude })
}

function genSaleCode(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  return `VNT-${ts}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

/** Crea Client + Sale en una transacción. reason = EN_GESTION. */
export async function createSale(user: AuthUser, input: Record<string, unknown>) {
  const campaingId = requireString(input.campaingId ?? input.campaignId, 'campaingId')

  // La sede se toma AUTOMÁTICAMENTE de la sede del usuario que sube la venta
  // (asesor/supervisor/back), no se selecciona. Así la venta queda ligada a su sede.
  const access = await prisma.sedeAccess.findFirst({
    where: {
      userId: user.userId,
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { sedeId: true },
  })
  if (!access) {
    throw new HttpError(400, 'No tienes una sede asignada; pide acceso a una sede para registrar ventas')
  }
  const sedeId = access.sedeId

  const leadId = typeof input.leadId === 'string' && input.leadId ? input.leadId : null
  if (leadId) {
    const lead = await prisma.lead.findFirst({
      where: { AND: [{ id: leadId }, { campaignId: campaingId }] },
      include: { sale: { select: { id_sale: true } } },
    })
    if (!lead) throw new HttpError(400, 'Lead no encontrado en esa campaña')
    if (lead.status !== LEAD_STATUS.POSITIVO) throw new HttpError(400, 'El lead debe estar en POSITIVO')
    if (lead.sale) throw new HttpError(409, 'El lead ya tiene una venta')
  }

  const managerAdvisorId = typeof input.managerAdvisorId === 'string' ? input.managerAdvisorId : null

  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({ data: buildClientCreate(input) })
    const saleData = {
      code: genSaleCode(),
      reason: SaleStatus.EN_GESTION,
      client: { connect: { id_cliente: client.id_cliente } },
      campaign: { connect: { campaign_id: campaingId } },
      sede: { connect: { sede_id: sedeId } },
      advisor: { connect: { user_id: user.userId } },
      ...(leadId ? { lead: { connect: { id: leadId } } } : {}),
      ...(managerAdvisorId ? { managerAdvisor: { connect: { user_id: managerAdvisorId } } } : {}),
      ...pickFields(input, SALE_ADVISOR_FIELDS),
    } as Prisma.SaleCreateInput
    return tx.sale.create({ data: saleData, include: listInclude })
  })
}

/** Edita una venta. Campos permitidos según rol. */
export async function updateSale(user: AuthUser, id: string, input: Record<string, unknown>) {
  const sale = await getVisibleSale(user, id)

  const isBack = user.role === 'BACK'
  const isAdmin = user.role === 'ADMIN'
  if (user.role === 'ASESOR') {
    if (sale.advisorId !== user.userId) throw new HttpError(403, 'No es tu venta')
    if (sale.reason !== SaleStatus.EN_GESTION) {
      throw new HttpError(403, 'Solo puedes editar mientras la venta esté EN_GESTION')
    }
  } else if (!isBack && !isAdmin) {
    throw new HttpError(403, 'No tienes permiso para editar ventas')
  }

  const saleUpdate: Record<string, unknown> = { ...pickFields(input, SALE_ADVISOR_FIELDS) }
  if (isBack || isAdmin) Object.assign(saleUpdate, pickFields(input, SALE_BACK_FIELDS))
  if (isBack) saleUpdate.backOfficeId = user.userId

  return prisma.$transaction(async (tx) => {
    await tx.client.update({ where: { id_cliente: sale.clientId }, data: buildClientUpdate(input) })
    return tx.sale.update({
      where: { id_sale: id },
      data: saleUpdate as Prisma.SaleUncheckedUpdateInput,
      include: listInclude,
    })
  })
}
