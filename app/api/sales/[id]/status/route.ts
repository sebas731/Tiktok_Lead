import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { updateSaleStatus } from '@/lib/sales/status'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireRole(['ADMIN', 'BACK'])
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await updateSaleStatus(user, id, body))
  } catch (e) {
    return errorResponse(e)
  }
}
