import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { assignUsersToCampaign } from '@/lib/campaigns/service'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(['ADMIN'])
    const { id } = await params
    const body = await readJson<{ userIds?: unknown }>(req)
    return NextResponse.json(await assignUsersToCampaign(id, body.userIds))
  } catch (e) {
    return errorResponse(e)
  }
}
