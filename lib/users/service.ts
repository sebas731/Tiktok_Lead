import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma/client'
import { comparePassword, hashPassword } from '@/lib/auth/password'
import { HttpError, requireString } from '@/lib/api/response'
import {
  type AuthUser,
  type Role,
  getAccessibleSedeIds,
  getGroupAsesorIds,
} from '@/lib/auth/authorize'

/** Cada usuario cambia su propia contraseña (verifica la actual). */
export async function changeOwnPassword(user: AuthUser, input: Record<string, unknown>) {
  const current = requireString(input.currentPassword, 'currentPassword')
  const next = requireString(input.newPassword, 'newPassword')
  if (next.length < 4) throw new HttpError(400, 'La nueva contraseña debe tener al menos 4 caracteres')

  const u = await prisma.user.findUnique({ where: { user_id: user.userId }, select: { password: true } })
  if (!u) throw new HttpError(404, 'Usuario no encontrado')
  const ok = await comparePassword(current, u.password)
  if (!ok) throw new HttpError(400, 'La contraseña actual no es correcta')

  await prisma.user.update({ where: { user_id: user.userId }, data: { password: await hashPassword(next) } })
  return { changed: true }
}

/** Campos públicos de un usuario. NUNCA incluye `password`. */
export const publicUserSelect = {
  user_id: true,
  login: true,
  email: true,
  name: true,
  first_last_name: true,
  second_last_name: true,
  department: true,
  document_type: true,
  document_number: true,
  status: true,
  create_at: true,
  rol: { select: { id_rol: true, name: true } },
} satisfies Prisma.UserSelect

/** ADMIN ve a todos (con filtro opcional por rol); SUPERVISOR solo los asesores
 *  de su grupo; otros roles, nada. */
export async function listUsers(user: AuthUser, roleFilter?: string | null, search?: string | null) {
  // Combo de SUPERVISOR: ADMIN y BACK ven a TODOS los supervisores; el asesor
  // (o supervisor) solo ve los supervisores de su(s) sede(s).
  if (roleFilter === 'SUPERVISOR') {
    const supConds: Prisma.UserWhereInput[] = [{ rol: { name: 'SUPERVISOR' } }]
    if (user.role !== 'ADMIN' && user.role !== 'BACK') {
      const sedeIds = await getAccessibleSedeIds(user)
      supConds.push({ sedeAccess: { some: { active: true, sedeId: { in: sedeIds } } } })
    }
    if (search) {
      supConds.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { document_number: { contains: search } },
        ],
      })
    }
    return prisma.user.findMany({
      where: { AND: supConds },
      select: publicUserSelect,
      orderBy: { name: 'asc' },
    })
  }

  const conds: Prisma.UserWhereInput[] = []
  if (user.role === 'ADMIN') {
    if (roleFilter) conds.push({ rol: { name: roleFilter } })
  } else if (user.role === 'SUPERVISOR') {
    // Al BUSCAR un asesor (por nombre/DNI) para asignarle leads, puede encontrar
    // a CUALQUIER asesor, esté o no en su grupo. Sin búsqueda, solo su grupo.
    if (search && roleFilter === 'ASESOR') {
      conds.push({ rol: { name: 'ASESOR' } })
    } else {
      conds.push({ user_id: { in: await getGroupAsesorIds(user) } })
    }
  } else {
    conds.push({ user_id: '__none__' })
  }
  if (search) {
    conds.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { document_number: { contains: search } },
      ],
    })
  }
  return prisma.user.findMany({
    where: conds.length ? { AND: conds } : {},
    select: publicUserSelect,
    orderBy: { create_at: 'desc' },
  })
}

/** Detalle completo: datos + sedes accesibles + campañas asignadas + grupo. */
export function getUserDetail(id: string) {
  return prisma.user.findUnique({
    where: { user_id: id },
    select: {
      ...publicUserSelect,
      sedeAccess: {
        where: { active: true },
        select: { sedeId: true, expiresAt: true, sede: { select: { code: true, name: true } } },
      },
      campaignAssignments: {
        select: { campaign: { select: { campaign_id: true, name: true } } },
      },
      membresiasGrupo: { select: { grupo: { select: { grupo_id: true, name: true } } } },
      gruposComoSupervisor: { select: { grupo_id: true, name: true } },
    },
  })
}

async function resolveRoleId(input: { idRol?: unknown; roleName?: unknown }): Promise<string> {
  if (typeof input.idRol === 'string' && input.idRol) return input.idRol
  if (typeof input.roleName === 'string' && input.roleName) {
    const rol = await prisma.rOL.findFirst({ where: { name: input.roleName } })
    if (!rol) throw new HttpError(400, `Rol no encontrado: ${input.roleName}`)
    return rol.id_rol
  }
  throw new HttpError(400, 'Debes indicar idRol o roleName')
}

export type CreateUserInput = Record<string, unknown>

export async function createUser(input: CreateUserInput) {
  const idRol = await resolveRoleId(input)
  const data: Prisma.UserCreateInput = {
    login: requireString(input.login, 'login'),
    password: await hashPassword(requireString(input.password, 'password')),
    email: requireString(input.email, 'email'),
    name: requireString(input.name, 'name'),
    first_last_name: requireString(input.first_last_name, 'first_last_name'),
    second_last_name: requireString(input.second_last_name, 'second_last_name'),
    document_number: requireString(input.document_number, 'document_number'),
    rol: { connect: { id_rol: idRol } },
  }
  if (typeof input.department === 'string') data.department = input.department
  return prisma.user.create({ data, select: publicUserSelect })
}

/** Actualiza campos permitidos, incluyendo activar/desactivar vía `status`. */
export async function updateUser(id: string, input: Record<string, unknown>) {
  const data: Prisma.UserUpdateInput = {}
  const fields = ['name', 'email', 'first_last_name', 'second_last_name', 'department'] as const
  for (const f of fields) {
    if (typeof input[f] === 'string') data[f] = input[f] as string
  }
  if (typeof input.status === 'boolean') data.status = input.status
  if (typeof input.password === 'string' && input.password) {
    data.password = await hashPassword(input.password)
  }
  if (typeof input.roleName === 'string' || typeof input.idRol === 'string') {
    data.rol = { connect: { id_rol: await resolveRoleId(input) } }
  }
  return prisma.user.update({ where: { user_id: id }, data, select: publicUserSelect })
}

/** Usuario actual básico (usado por el layout para el nombre/rol). */
export function getCurrentUser(user: AuthUser) {
  return prisma.user.findUnique({ where: { user_id: user.userId }, select: publicUserSelect })
}

/** Usuario actual enriquecido para GET /api/auth/me: + sedes accesibles + grupo. */
export async function getMe(user: AuthUser) {
  const [me, sedeIds, membership] = await Promise.all([
    prisma.user.findUnique({ where: { user_id: user.userId }, select: publicUserSelect }),
    getAccessibleSedeIds(user),
    prisma.grupoMember.findFirst({
      where: { asesorId: user.userId },
      select: { grupo: { select: { grupo_id: true, name: true } } },
    }),
  ])
  if (!me) return null
  const sedes = await prisma.sede.findMany({
    where: { sede_id: { in: sedeIds } },
    select: { sede_id: true, code: true, name: true },
  })
  return { ...me, sedes, grupo: membership?.grupo ?? null }
}

export type { Role }
