import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma/client'
import { hashPassword } from '@/lib/auth/password'
import { HttpError, requireString } from '@/lib/api/response'
import type { AuthUser, Role } from '@/lib/auth/authorize'

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

/** ADMIN ve a todos; SUPERVISOR solo a los asesores; otros roles, nada. */
export function listUsers(user: AuthUser) {
  const where: Prisma.UserWhereInput =
    user.role === 'ADMIN'
      ? {}
      : user.role === 'SUPERVISOR'
        ? { rol: { name: 'ASESOR' } }
        : { user_id: '__none__' }
  return prisma.user.findMany({
    where,
    select: publicUserSelect,
    orderBy: { create_at: 'desc' },
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

/** Devuelve el usuario actual (para GET /api/auth/me). */
export function getCurrentUser(user: AuthUser) {
  return prisma.user.findUnique({ where: { user_id: user.userId }, select: publicUserSelect })
}

export type { Role }
