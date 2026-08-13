import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse } from '@/lib/api/response'
import { removeMember } from '@/lib/grupos/service'

type Ctx = { params: Promise<{ id: string; asesorId: string }> }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireRole(['ADMIN'])
    const { id, asesorId } = await params
    return NextResponse.json(await removeMember(id, asesorId))
  } catch (e) {
    return errorResponse(e)
  }
}
