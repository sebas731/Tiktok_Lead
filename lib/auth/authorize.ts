import { getSession } from '@/lib/auth/session'
import { Prisma, LEAD_STATUS } from '@/lib/generated/prisma/client'

// Roles del sistema (coinciden con ROL.name que viaja en el token).
export type Role = 'ADMIN' | 'SUPERVISOR' | 'ASESOR' | 'BACK'

export type AuthUser = {
  userId: string
  role: Role
}

/**
 * Error de autorización con código HTTP. Las rutas lo capturan y lo mapean a
 * la respuesta correspondiente (ver `errorResponse`).
 */
export class AuthError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/** Valida la sesión y devuelve el usuario (id + rol). Lanza 401 si no hay sesión. */
export async function requireAuth(): Promise<AuthUser> {
  const session = await getSession()
  if (!session) {
    throw new AuthError('No autenticado', 401)
  }
  return { userId: session.userId, role: session.role as Role }
}

/** Exige que el usuario tenga uno de los roles dados. Lanza 403 si no. */
export async function requireRole(roles: Role[]): Promise<AuthUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new AuthError('No tienes permiso para esta acción', 403)
  }
  return user
}

/**
 * Filtro de Prisma para CAMPAÑAS visibles según el rol.
 * - ADMIN: todas.
 * - SUPERVISOR / BACK: solo las asignadas vía CampaignAssignment.
 * - ASESOR: solo las campañas donde tiene al menos un lead asignado.
 */
export function campaignWhereForUser(user: AuthUser): Prisma.CampaignWhereInput {
  switch (user.role) {
    case 'ADMIN':
      return {}
    case 'SUPERVISOR':
    case 'BACK':
      return { campaignAssignments: { some: { userId: user.userId } } }
    case 'ASESOR':
      return { lead: { some: { asignadoAId: user.userId } } }
    default:
      throw new AuthError('Rol no reconocido', 403)
  }
}

/**
 * Filtro de Prisma para LEADS visibles según el rol.
 * - ADMIN: todos.
 * - SUPERVISOR: los de sus campañas asignadas.
 * - BACK: los de sus campañas asignadas, solo en status POSITIVO.
 * - ASESOR: solo los leads asignados directamente a él.
 */
export function leadWhereForUser(user: AuthUser): Prisma.LeadWhereInput {
  const enSusCampanias: Prisma.LeadWhereInput = {
    campaign: { campaignAssignments: { some: { userId: user.userId } } },
  }
  switch (user.role) {
    case 'ADMIN':
      return {}
    case 'SUPERVISOR':
      return enSusCampanias
    case 'BACK':
      return { ...enSusCampanias, status: LEAD_STATUS.POSITIVO }
    case 'ASESOR':
      return { asignadoAId: user.userId }
    default:
      throw new AuthError('Rol no reconocido', 403)
  }
}
