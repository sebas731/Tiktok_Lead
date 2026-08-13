import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/authorize'
import { errorResponse, HttpError, readJson } from '@/lib/api/response'
import { getSaleDetail, updateSale } from '@/lib/sales/service'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const sale = await getSaleDetail(user, id)
    if (!sale) throw new HttpError(404, 'Venta no encontrada')
    return NextResponse.json(sale)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await updateSale(user, id, body))
  } catch (e) {
    return errorResponse(e)
  }
}
