import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson, requireString } from '@/lib/api/response'
import { assignUserToCampaign, listCampaignUsers } from '@/lib/campaigns/service'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    const { id } = await params
    return NextResponse.json(await listCampaignUsers(user, id))
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    const { id } = await params
    const body = await readJson<{ userId?: unknown }>(req)
    return NextResponse.json(await assignUserToCampaign(user, id, requireString(body.userId, 'userId')))
  } catch (e) {
    return errorResponse(e)
  }
}
