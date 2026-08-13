import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { createSede, listSedes } from '@/lib/sedes/service'

export async function GET() {
  try {
    const user = await requireAuth()
    return NextResponse.json(await listSedes(user))
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['ADMIN'])
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await createSede(body), { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}
