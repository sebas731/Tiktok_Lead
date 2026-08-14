import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { deleteCampaign, updateCampaign } from '@/lib/campaigns/service'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(['ADMIN'])
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await updateCampaign(id, body))
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(['ADMIN'])
    const { id } = await params
    return NextResponse.json(await deleteCampaign(id))
  } catch (e) {
    return errorResponse(e)
  }
}
