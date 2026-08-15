import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse } from '@/lib/api/response'
import { removeCampaignUser } from '@/lib/campaigns/service'

type Ctx = { params: Promise<{ id: string; userId: string }> }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    const { id, userId } = await params
    return NextResponse.json(await removeCampaignUser(user, id, userId))
  } catch (e) {
    return errorResponse(e)
  }
}
