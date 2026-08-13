import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, HttpError, readJson } from '@/lib/api/response'
import { getUserDetail, updateUser } from '@/lib/users/service'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(['ADMIN'])
    const { id } = await params
    const user = await getUserDetail(id)
    if (!user) throw new HttpError(404, 'Usuario no encontrado')
    return NextResponse.json(user)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(['ADMIN'])
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await updateUser(id, body))
  } catch (e) {
    return errorResponse(e)
  }
}
