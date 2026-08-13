import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/authorize'
import { errorResponse, HttpError, readJson } from '@/lib/api/response'
import { createUser, listUsers } from '@/lib/users/service'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const p = new URL(req.url).searchParams
    const roleFilter = p.get('role')
    // ADMIN/SUPERVISOR consultan libremente; ASESOR y BACK solo el combo de
    // supervisores (para asignar el supervisor de la venta). listUsers ya
    // acota los resultados por sede según el rol.
    if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR' && roleFilter !== 'SUPERVISOR') {
      throw new HttpError(403, 'No autorizado')
    }
    return NextResponse.json(await listUsers(user, roleFilter, p.get('search')))
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['ADMIN'])
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await createUser(body), { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}
