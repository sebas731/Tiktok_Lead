import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { createUser, listUsers } from '@/lib/users/service'

export async function GET() {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    return NextResponse.json(await listUsers(user))
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['ADMIN'])
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await createUser(body), { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}
