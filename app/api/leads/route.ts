import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/authorize'
import { errorResponse } from '@/lib/api/response'
import { listLeads } from '@/lib/leads/service'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(req.url)
    return NextResponse.json(
      await listLeads(user, {
        campaignId: searchParams.get('campaignId'),
        status: searchParams.get('status'),
        asignadoA: searchParams.get('asignadoA'),
        excludeFinal: searchParams.get('excludeFinal') === '1',
        asesorView: searchParams.get('view') as 'pendientes' | 'historial' | null,
      })
    )
  } catch (e) {
    return errorResponse(e)
  }
}
