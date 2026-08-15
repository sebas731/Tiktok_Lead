import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/authorize'
import { errorResponse, requireString } from '@/lib/api/response'
import { countAvailableLeads } from '@/lib/leads/service'

/** Cantidad de leads sin atender (pool disponible) de una campaña. */
export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const campaignId = requireString(new URL(req.url).searchParams.get('campaignId'), 'campaignId')
    return NextResponse.json({ count: await countAvailableLeads(campaignId) })
  } catch (e) {
    return errorResponse(e)
  }
}
