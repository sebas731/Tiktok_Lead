import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { createSale, getSale, updateSale } from '@/lib/leads/sale'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireAuth()
    const { id } = await params
    return NextResponse.json(await getSale(user, id))
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await createSale(user, id, body), { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireRole(['ADMIN', 'BACK'])
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await updateSale(user, id, body))
  } catch (e) {
    return errorResponse(e)
  }
}
