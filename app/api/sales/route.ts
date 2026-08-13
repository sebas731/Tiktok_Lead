import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { createSale, listSales } from '@/lib/sales/service'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const p = new URL(req.url).searchParams
    return NextResponse.json(
      await listSales(user, {
        sedeId: p.get('sedeId'),
        campaignId: p.get('campaignId'),
        reason: p.get('reason'),
        advisorId: p.get('advisorId'),
        fechaDesde: p.get('fechaDesde'),
        fechaHasta: p.get('fechaHasta'),
        scope: p.get('scope'),
      })
    )
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await createSale(user, body), { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}
