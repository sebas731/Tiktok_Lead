import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { getBranding, updateBranding } from '@/lib/settings/branding'

// Público: lo consume el login.
export async function GET() {
  try {
    return NextResponse.json(await getBranding())
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole(['ADMIN'])
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await updateBranding(body))
  } catch (e) {
    return errorResponse(e)
  }
}
