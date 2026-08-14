import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/authorize'
import { errorResponse, readJson, requireString } from '@/lib/api/response'
import { selfAssignLead } from '@/lib/leads/service'

/** El asesor se autoasigna el lead más nuevo del pool (campañas en modo AUTO). */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await readJson<Record<string, unknown>>(req)
    const campaignId = requireString(body.campaignId, 'campaignId')
    return NextResponse.json(await selfAssignLead(user, campaignId))
  } catch (e) {
    return errorResponse(e)
  }
}
