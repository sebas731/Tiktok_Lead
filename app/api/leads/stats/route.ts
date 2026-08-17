import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse } from '@/lib/api/response'
import { campaignBreakdown } from '@/lib/stats/leadStats'

export async function GET() {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    return NextResponse.json(await campaignBreakdown(user))
  } catch (e) {
    return errorResponse(e)
  }
}
