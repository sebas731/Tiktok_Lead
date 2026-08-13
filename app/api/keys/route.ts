import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { createKey, listKeys } from '@/lib/keys/service'

export async function GET() {
  try {
    await requireRole(['ADMIN'])
    return NextResponse.json(await listKeys())
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['ADMIN'])
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await createKey(body), { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}
