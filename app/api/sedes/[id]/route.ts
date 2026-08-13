import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, HttpError, readJson } from '@/lib/api/response'
import { getSedeDetail, updateSede } from '@/lib/sedes/service'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(['ADMIN'])
    const { id } = await params
    const sede = await getSedeDetail(id)
    if (!sede) throw new HttpError(404, 'Sede no encontrada')
    return NextResponse.json(sede)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(['ADMIN'])
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await updateSede(id, body))
  } catch (e) {
    return errorResponse(e)
  }
}
