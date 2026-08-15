import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { addMember } from '@/lib/grupos/service'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireRole(['ADMIN', 'SUPERVISOR'])
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await addMember(user, id, body), { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}
