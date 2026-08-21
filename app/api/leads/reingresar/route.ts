import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { reingresarLeadsByNumbers } from '@/lib/leads/service'

/** Reingreso manual por lista de números (ADMIN o SUPERVISOR de la campaña). */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await reingresarLeadsByNumbers(user, body))
  } catch (e) {
    return errorResponse(e)
  }
}
