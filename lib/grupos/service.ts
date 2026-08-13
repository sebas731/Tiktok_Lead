import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma/client'
import { HttpError, requireString } from '@/lib/api/response'
import { type AuthUser, getAccessibleSedeIds } from '@/lib/auth/authorize'

const grupoInclude = {
  supervisor: { select: { user_id: true, name: true } },
  sede: { select: { sede_id: true, code: true, name: true } },
  members: {
    include: { asesor: { select: { user_id: true, name: true } } },
  },
} satisfies Prisma.GrupoInclude

/** ADMIN y BACK ven todos; SUPERVISOR ve todas las salas de su(s) sede(s). */
export async function listGrupos(user: AuthUser) {
  const seeAll = user.role === 'ADMIN' || user.role === 'BACK'
  const where: Prisma.GrupoWhereInput = seeAll
    ? {}
    : { sedeId: { in: await getAccessibleSedeIds(user) } }
  return prisma.grupo.findMany({ where, orderBy: { createdAt: 'desc' }, include: grupoInclude })
}

async function assertRole(userId: string, role: string) {
  const u = await prisma.user.findFirst({ where: { user_id: userId, rol: { name: role } } })
  if (!u) throw new HttpError(400, `El usuario indicado no tiene rol ${role}`)
}

export async function createGrupo(input: Record<string, unknown>) {
  const supervisorId = requireString(input.supervisorId, 'supervisorId')
  const sedeId = requireString(input.sedeId, 'sedeId')
  await assertRole(supervisorId, 'SUPERVISOR')
  return prisma.grupo.create({
    data: {
      name: requireString(input.name, 'name'),
      supervisor: { connect: { user_id: supervisorId } },
      sede: { connect: { sede_id: sedeId } },
    },
    include: grupoInclude,
  })
}

export async function updateGrupo(id: string, input: Record<string, unknown>) {
  const data: Prisma.GrupoUpdateInput = {}
  if (typeof input.name === 'string') data.name = input.name
  if (typeof input.status === 'boolean') data.status = input.status
  if (typeof input.supervisorId === 'string') {
    await assertRole(input.supervisorId, 'SUPERVISOR')
    data.supervisor = { connect: { user_id: input.supervisorId } }
  }
  if (typeof input.sedeId === 'string' && input.sedeId) {
    data.sede = { connect: { sede_id: input.sedeId } }
  }
  return prisma.grupo.update({ where: { grupo_id: id }, data, include: grupoInclude })
}

/** Agrega un asesor al grupo (debe tener rol ASESOR). Idempotente. */
export async function addMember(grupoId: string, input: Record<string, unknown>) {
  const asesorId = requireString(input.asesorId, 'asesorId')
  await assertRole(asesorId, 'ASESOR')
  await prisma.grupoMember.upsert({
    where: { grupoId_asesorId: { grupoId, asesorId } },
    create: { grupoId, asesorId },
    update: {},
  })
  return prisma.grupo.findUnique({ where: { grupo_id: grupoId }, include: grupoInclude })
}

export async function removeMember(grupoId: string, asesorId: string) {
  await prisma.grupoMember.deleteMany({ where: { grupoId, asesorId } })
  return { removed: true }
}
