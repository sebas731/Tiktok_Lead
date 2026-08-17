import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/authorize'
import { errorResponse } from '@/lib/api/response'
import { asesorLeadStats } from '@/lib/stats/leadStats'

export async function GET() {
  try {
    const user = await requireAuth()
    return NextResponse.json(await asesorLeadStats(user))
  } catch (e) {
    return errorResponse(e)
  }
}
