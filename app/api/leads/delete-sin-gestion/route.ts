import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { deleteSinGestionLeads } from '@/lib/leads/service'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(['ADMIN'])
    const body = await readJson<{ campaignId?: unknown }>(req)
    return NextResponse.json(await deleteSinGestionLeads(user, body.campaignId))
  } catch (e) {
    return errorResponse(e)
  }
}
