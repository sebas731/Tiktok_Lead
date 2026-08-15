import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse } from '@/lib/api/response'
import { processedLeadDetail } from '@/lib/reports/service'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    const p = new URL(req.url).searchParams
    return NextResponse.json(
      await processedLeadDetail(user, {
        asesorId: p.get('asesorId'),
        campaignId: p.get('campaignId'),
        desde: p.get('desde'),
        hasta: p.get('hasta'),
        status: p.get('status'),
      }),
    )
  } catch (e) {
    return errorResponse(e)
  }
}
