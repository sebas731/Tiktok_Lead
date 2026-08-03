import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { createCampaign, listCampaigns } from '@/lib/campaigns/service'

export async function GET() {
  try {
    const user = await requireAuth()
    return NextResponse.json(await listCampaigns(user))
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['ADMIN'])
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await createCampaign(body), { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}
