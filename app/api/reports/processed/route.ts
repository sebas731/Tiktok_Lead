import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse } from '@/lib/api/response'
import { leadsProcessedByAsesor } from '@/lib/reports/service'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    const p = new URL(req.url).searchParams
    return NextResponse.json(
      await leadsProcessedByAsesor(user, {
        campaignId: p.get('campaignId'),
        desde: p.get('desde'),
        hasta: p.get('hasta'),
        asesorId: p.get('asesorId'),
        status: p.get('status'),
      }),
    )
  } catch (e) {
    return errorResponse(e)
  }
}
