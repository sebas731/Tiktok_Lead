import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { reclaimLeadByNumber } from '@/lib/leads/service'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(['ASESOR'])
    const body = await readJson<{ number?: unknown }>(req)
    return NextResponse.json(await reclaimLeadByNumber(user, body.number))
  } catch (e) {
    return errorResponse(e)
  }
}
