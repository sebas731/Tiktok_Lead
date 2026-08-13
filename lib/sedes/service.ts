import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma/client'
import { HttpError, requireString } from '@/lib/api/response'
import { type AuthUser, getAccessibleSedeIds } from '@/lib/auth/authorize'

/** ADMIN ve todas; el resto solo las sedes accesibles. Incluye conteo de ventas. */
export async function listSedes(user: AuthUser) {
  const args = {
    orderBy: { code: 'asc' } as const,
    include: { _count: { select: { sales: true } } },
  }
  if (user.role === 'ADMIN') {
    return prisma.sede.findMany(args)
  }
  const ids = await getAccessibleSedeIds(user)
  return prisma.sede.findMany({ where: { sede_id: { in: ids } }, ...args })
}

/** Detalle de una sede + usuarios con acceso activo. */
export function getSedeDetail(id: string) {
  return prisma.sede.findUnique({
    where: { sede_id: id },
    include: {
      access: {
        where: { active: true },
        select: {
          userId: true,
          expiresAt: true,
          user: { select: { user_id: true, name: true, rol: { select: { name: true } } } },
        },
      },
    },
  })
}

export function createSede(input: Record<string, unknown>) {
  const data: Prisma.SedeCreateInput = {
    code: requireString(input.code, 'code'),
    name: requireString(input.name, 'name'),
  }
  if (typeof input.address === 'string') data.address = input.address
  return prisma.sede.create({ data })
}

export function updateSede(id: string, input: Record<string, unknown>) {
  const data: Prisma.SedeUpdateInput = {}
  if (typeof input.code === 'string') data.code = input.code
  if (typeof input.name === 'string') data.name = input.name
  if (typeof input.address === 'string') data.address = input.address
  if (typeof input.status === 'boolean') data.status = input.status
  return prisma.sede.update({ where: { sede_id: id }, data })
}

/** Otorga (o reactiva) acceso de un usuario a una sede, con expiración opcional. */
export function grantAccess(sedeId: string, input: Record<string, unknown>) {
  const userId = requireString(input.userId, 'userId')
  const expiresAt = typeof input.expiresAt === 'string' ? new Date(input.expiresAt) : null
  return prisma.sedeAccess.upsert({
    where: { sedeId_userId: { sedeId, userId } },
    create: { sedeId, userId, expiresAt, active: true },
    update: { expiresAt, active: true, grantedAt: new Date() },
  })
}

/** Revoca el acceso de un usuario a una sede. */
export async function revokeAccess(sedeId: string, userId: string) {
  await prisma.sedeAccess.deleteMany({ where: { sedeId, userId } })
  return { revoked: true }
}
