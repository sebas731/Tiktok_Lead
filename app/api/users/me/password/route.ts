import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/authorize'
import { errorResponse, readJson } from '@/lib/api/response'
import { changeOwnPassword } from '@/lib/users/service'

/** Cada usuario cambia su propia contraseña. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await readJson<Record<string, unknown>>(req)
    return NextResponse.json(await changeOwnPassword(user, body))
  } catch (e) {
    return errorResponse(e)
  }
}
