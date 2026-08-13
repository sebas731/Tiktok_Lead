import { prisma } from '@/lib/prisma'
import { Prisma, SaleStatus, SaleSubStatus } from '@/lib/generated/prisma/client'
import { HttpError, requireEnum } from '@/lib/api/response'
import { type AuthUser } from '@/lib/auth/authorize'
import { SUBSTATUS_BY_STATUS } from '@/lib/constants/saleStatus'
import { getVisibleSale } from './service'
import { pickFields } from './fields'

const DETAIL_FIELDS = [
  { key: 'cod_client', kind: 'str' as const },
  { key: 'payment_date', kind: 'date' as const },
  { key: 'payment_status', kind: 'str' as const },
  { key: 'region', kind: 'str' as const },
  { key: 'pdv', kind: 'str' as const },
  { key: 'rejection_date', kind: 'date' as const },
  { key: 'contrata_ins', kind: 'str' as const },
  { key: 'sales_status', kind: 'str' as const },
  { key: 'sub_sales_status', kind: 'str' as const },
  { key: 'installation_date', kind: 'date' as const },
  { key: 'loteado', kind: 'str' as const },
]

const INSTALL_FIELDS = [
  { key: 'installation_date', kind: 'date' as const },
  { key: 'installation_time', kind: 'str' as const },
  { key: 'coments', kind: 'str' as const },
]

/** Actualiza reason + sub_reason, validando que el submotivo pertenezca al motivo. */
export async function updateSaleStatus(user: AuthUser, id: string, input: Record<string, unknown>) {
  await getVisibleSale(user, id)
  const reason = requireEnum(input.reason, SaleStatus, 'reason')
  let subReason: SaleSubStatus | null = null
  if (input.sub_reason !== undefined && input.sub_reason !== null && input.sub_reason !== '') {
    const sub = requireEnum(input.sub_reason, SaleSubStatus, 'sub_reason')
    if (!SUBSTATUS_BY_STATUS[reason].includes(sub)) {
      throw new HttpError(400, 'El submotivo no corresponde al motivo elegido')
    }
    subReason = sub
  }
  return prisma.sale.update({
    where: { id_sale: id },
    data: { reason, sub_reason: subReason },
  })
}

/** Crea o actualiza el SaleDetail (seguimiento del BACK). */
export async function upsertSaleDetail(user: AuthUser, saleId: string, input: Record<string, unknown>) {
  await getVisibleSale(user, saleId)
  const data = pickFields(input, DETAIL_FIELDS)
  return prisma.saleDetail.upsert({
    where: { saleId },
    create: { saleId, ...data } as Prisma.SaleDetailUncheckedCreateInput,
    update: data as Prisma.SaleDetailUncheckedUpdateInput,
  })
}

/** Crea o actualiza el InstallationSchedule. */
export async function upsertInstallation(user: AuthUser, saleId: string, input: Record<string, unknown>) {
  await getVisibleSale(user, saleId)
  const data = pickFields(input, INSTALL_FIELDS)
  return prisma.installationSchedule.upsert({
    where: { saleId },
    create: { saleId, ...data } as Prisma.InstallationScheduleUncheckedCreateInput,
    update: data as Prisma.InstallationScheduleUncheckedUpdateInput,
  })
}
