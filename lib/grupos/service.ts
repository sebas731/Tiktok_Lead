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

/**
 * ADMIN y BACK ven todos; el SUPERVISOR ve los grupos que supervisa (siempre,
 * aunque no tenga sede asignada) y además las salas de su(s) sede(s).
 */
export async function listGrupos(user: AuthUser) {
  const seeAll = user.role === 'ADMIN' || user.role === 'BACK'
  let where: Prisma.GrupoWhereInput = {}
  if (!seeAll) {
    const sedeIds = await getAccessibleSedeIds(user)
    where = { OR: [{ supervisorId: user.userId }, { sedeId: { in: sedeIds } }] }
  }
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

/** ADMIN gestiona cualquier grupo; el SUPERVISOR solo los que él supervisa. */
async function assertCanManageGrupo(user: AuthUser, grupoId: string) {
  if (user.role === 'ADMIN') return
  if (user.role !== 'SUPERVISOR') throw new HttpError(403, 'No tienes permiso para gestionar grupos')
  const g = await prisma.grupo.findUnique({ where: { grupo_id: grupoId }, select: { supervisorId: true } })
  if (!g || g.supervisorId !== user.userId) throw new HttpError(403, 'No supervisas ese grupo')
}

export async function updateGrupo(user: AuthUser, id: string, input: Record<string, unknown>) {
  await assertCanManageGrupo(user, id)
  const data: Prisma.GrupoUpdateInput = {}
  if (typeof input.name === 'string') data.name = input.name
  if (typeof input.status === 'boolean') data.status = input.status
  // Solo el ADMIN puede reasignar el supervisor o la sede del grupo.
  if (user.role === 'ADMIN') {
    if (typeof input.supervisorId === 'string') {
      await assertRole(input.supervisorId, 'SUPERVISOR')
      data.supervisor = { connect: { user_id: input.supervisorId } }
    }
    if (typeof input.sedeId === 'string' && input.sedeId) {
      data.sede = { connect: { sede_id: input.sedeId } }
    }
  }
  return prisma.grupo.update({ where: { grupo_id: id }, data, include: grupoInclude })
}

/** Agrega un asesor al grupo (debe tener rol ASESOR). Idempotente. */
export async function addMember(user: AuthUser, grupoId: string, input: Record<string, unknown>) {
  await assertCanManageGrupo(user, grupoId)
  const asesorId = requireString(input.asesorId, 'asesorId')
  await assertRole(asesorId, 'ASESOR')
  await prisma.grupoMember.upsert({
    where: { grupoId_asesorId: { grupoId, asesorId } },
    create: { grupoId, asesorId },
    update: {},
  })
  return prisma.grupo.findUnique({ where: { grupo_id: grupoId }, include: grupoInclude })
}

/** Quita un asesor del grupo (deniega su acceso). */
export async function removeMember(user: AuthUser, grupoId: string, asesorId: string) {
  await assertCanManageGrupo(user, grupoId)
  await prisma.grupoMember.deleteMany({ where: { grupoId, asesorId } })
  return { removed: true }
}
