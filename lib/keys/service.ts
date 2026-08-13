import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma/client'
import { HttpError, requireString } from '@/lib/api/response'

/** Enmascara el token: solo se ven los últimos 4 caracteres. */
function maskToken(token: string): string {
  const last4 = token.slice(-4)
  return `••••••••${last4}`
}

type KeyWithCount = Prisma.KeyGetPayload<{ include: { _count: { select: { campaigns: true } } } }>

/** Vista pública de una Key: NUNCA expone el accessToken completo. */
function toKeyRow(k: KeyWithCount) {
  return {
    id: k.id,
    name: k.name,
    advertiserId: k.advertiserId,
    tokenMasked: maskToken(k.accessToken),
    expiresAt: k.expiresAt,
    status: k.status,
    campaignCount: k._count.campaigns,
  }
}

const withCount = { _count: { select: { campaigns: true } } } satisfies Prisma.KeyInclude

/** Lista todas las Keys con el token enmascarado y el nº de campañas que la usan. */
export async function listKeys() {
  const keys = await prisma.key.findMany({ orderBy: { name: 'asc' }, include: withCount })
  return keys.map(toKeyRow)
}

export async function createKey(input: Record<string, unknown>) {
  const data: Prisma.KeyCreateInput = {
    name: requireString(input.name, 'name'),
    accessToken: requireString(input.accessToken, 'accessToken'),
    advertiserId: requireString(input.advertiserId, 'advertiserId'),
  }
  if (typeof input.expiresAt === 'string' && input.expiresAt) data.expiresAt = new Date(input.expiresAt)
  if (typeof input.status === 'boolean') data.status = input.status
  const k = await prisma.key.create({ data, include: withCount })
  return toKeyRow(k)
}

export async function updateKey(id: string, input: Record<string, unknown>) {
  const data: Prisma.KeyUpdateInput = {}
  if (typeof input.name === 'string') data.name = input.name
  if (typeof input.advertiserId === 'string') data.advertiserId = input.advertiserId
  // El token solo se reemplaza si se envía uno nuevo (permite renovarlo al expirar).
  if (typeof input.accessToken === 'string' && input.accessToken) data.accessToken = input.accessToken
  if (typeof input.expiresAt === 'string') data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null
  if (typeof input.status === 'boolean') data.status = input.status
  const k = await prisma.key.update({ where: { id }, data, include: withCount })
  return toKeyRow(k)
}

/** Elimina una Key, salvo que haya campañas usándola. */
export async function deleteKey(id: string) {
  const count = await prisma.campaign.count({ where: { keyId: id } })
  if (count > 0) {
    throw new HttpError(
      409,
      `No se puede eliminar: ${count} campaña(s) usan esta Key. Cámbiales la Key o elimínalas primero.`,
    )
  }
  await prisma.key.delete({ where: { id } })
  return { deleted: true }
}
