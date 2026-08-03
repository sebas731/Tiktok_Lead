import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { updateLead } from '@/lib/leads/service'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await updateLead(user, id, body))
  } catch (e) {
    return errorResponse(e)
  }
}
