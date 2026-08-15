import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { recoverLeads } from '@/lib/leads/service'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    const body = await readJson<{ campaignId?: unknown; leadIds?: unknown }>(req)
    return NextResponse.json(await recoverLeads(user, body))
  } catch (e) {
    return errorResponse(e)
  }
}
