import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse } from '@/lib/api/response'
import { syncExcelCampaign } from '@/lib/campaigns/sync'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(['ADMIN'])
    const { id } = await params
    return NextResponse.json(await syncExcelCampaign(id))
  } catch (e) {
    return errorResponse(e)
  }
}
