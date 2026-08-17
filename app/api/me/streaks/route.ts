import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/authorize'
import { errorResponse } from '@/lib/api/response'
import { getAsesorStreaks } from '@/lib/gamification/streaks'

export async function GET() {
  try {
    const user = await requireAuth()
    return NextResponse.json(await getAsesorStreaks(user.userId))
  } catch (e) {
    return errorResponse(e)
  }
}
