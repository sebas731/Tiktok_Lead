import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse } from '@/lib/api/response'
import { leadDetail } from '@/lib/stats/leadStats'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    const { searchParams } = new URL(req.url)
    return NextResponse.json(
      await leadDetail(user, {
        page: Number(searchParams.get('page')) || 1,
        status: searchParams.get('status'),
        campaignId: searchParams.get('campaignId'),
        order: searchParams.get('order') === 'desc' ? 'desc' : 'asc',
        desde: searchParams.get('desde'),
        hasta: searchParams.get('hasta'),
      }),
    )
  } catch (e) {
    return errorResponse(e)
  }
}
