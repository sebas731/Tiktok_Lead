import { NextRequest, NextResponse } from 'next/server'
import { requireRole, assertCanManageCampaign } from '@/lib/auth/authorize'
import { errorResponse } from '@/lib/api/response'
import { syncExcelCampaign } from '@/lib/campaigns/sync'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    const { id } = await params
    // El SUPERVISOR solo puede sincronizar las campañas que tiene asignadas.
    await assertCanManageCampaign(user, id)
    return NextResponse.json(await syncExcelCampaign(id))
  } catch (e) {
    return errorResponse(e)
  }
}
