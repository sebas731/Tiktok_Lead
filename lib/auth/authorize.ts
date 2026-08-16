import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
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
 * Exige que el usuario pueda gestionar la campaña: ADMIN cualquiera; SUPERVISOR
 * solo las que tiene asignadas (CampaignAssignment). Lanza 403 si no.
 */
export async function assertCanManageCampaign(user: AuthUser, campaignId: string): Promise<void> {
  if (user.role === 'ADMIN') return
  if (user.role !== 'SUPERVISOR') throw new AuthError('No tienes permiso sobre esta campaña', 403)
  const count = await prisma.campaignAssignment.count({ where: { campaignId, userId: user.userId } })
  if (count === 0) throw new AuthError('Esa campaña no está asignada a ti', 403)
}

// ── Filtros de campañas y leads (síncronos, puros) ──────────────────────────

/**
 * Filtro de Prisma para CAMPAÑAS visibles según el rol.
 * - ADMIN: todas.
 * - SUPERVISOR / BACK: solo las asignadas vía CampaignAssignment.
 * - ASESOR: solo las campañas donde tiene al menos un lead asignado.
 */
export function getCampaignFilter(user: AuthUser): Prisma.CampaignWhereInput {
  switch (user.role) {
    case 'ADMIN':
      return {}
    case 'SUPERVISOR':
    case 'BACK':
      return { campaignAssignments: { some: { userId: user.userId } } }
    case 'ASESOR':
      // Asignado a la campaña, o con al menos un lead suyo en ella.
      return {
        OR: [
          { campaignAssignments: { some: { userId: user.userId } } },
          { lead: { some: { asignadoAId: user.userId } } },
        ],
      }
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
export function getLeadFilter(user: AuthUser): Prisma.LeadWhereInput {
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
      // Solo sus leads asignados. En modo AUTO los obtiene con el botón
      // "Asignarme" (autoasignación), que los saca del pool y se los asigna.
      return { asignadoAId: user.userId }
    default:
      throw new AuthError('Rol no reconocido', 403)
  }
}

// ── Sedes y ventas (asíncronos, consultan la BD) ────────────────────────────

/** IDs de sedes con acceso activo y vigente (ADMIN accede a todas). */
export async function getAccessibleSedeIds(user: AuthUser): Promise<string[]> {
  if (user.role === 'ADMIN') {
    const sedes = await prisma.sede.findMany({ select: { sede_id: true } })
    return sedes.map((s) => s.sede_id)
  }
  const now = new Date()
  const access = await prisma.sedeAccess.findMany({
    where: {
      userId: user.userId,
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { sedeId: true },
  })
  return access.map((a) => a.sedeId)
}

/** ¿El usuario tiene acceso vigente a esa sede? (ADMIN siempre). */
export async function hasSedeAccess(user: AuthUser, sedeId: string): Promise<boolean> {
  if (user.role === 'ADMIN') return true
  const ids = await getAccessibleSedeIds(user)
  return ids.includes(sedeId)
}

/** IDs de los asesores del/los grupo(s) que supervisa el usuario. */
export async function getGroupAsesorIds(user: AuthUser): Promise<string[]> {
  const members = await prisma.grupoMember.findMany({
    where: { grupo: { supervisorId: user.userId } },
    select: { asesorId: true },
  })
  return members.map((m) => m.asesorId)
}

/**
 * Filtro de Prisma para VENTAS (modelo Sale), combinando campaña + sede + grupo.
 * Regla transversal: nadie (salvo ADMIN) ve ventas de sedes sin acceso vigente.
 * - ADMIN: todas.
 * - SUPERVISOR: las suyas y las de los asesores de su grupo, en sedes accesibles.
 * - ASESOR: solo las que él registró (advisorId), en sedes accesibles.
 * - BACK: las de TODOS los asesores de sus campañas asignadas, en sedes accesibles.
 */
export async function getSaleFilter(user: AuthUser): Promise<Prisma.SaleWhereInput> {
  if (user.role === 'ADMIN') return {}

  const sedeIds = await getAccessibleSedeIds(user)
  const sedeScope: Prisma.SaleWhereInput = { sedeId: { in: sedeIds } }

  switch (user.role) {
    case 'ASESOR':
      return { ...sedeScope, advisorId: user.userId }
    case 'SUPERVISOR':
      // El supervisor ve TODAS las ventas de su(s) sede(s). El acotado por grupo
      // o por sus propias ventas se aplica como filtro opcional (scope) en listSales.
      return sedeScope
    case 'BACK':
      return {
        ...sedeScope,
        campaign: { campaignAssignments: { some: { userId: user.userId } } },
      }
    default:
      throw new AuthError('Rol no reconocido', 403)
  }
}
