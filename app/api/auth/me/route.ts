import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/authorize'
import { errorResponse, HttpError } from '@/lib/api/response'
import { getCurrentUser } from '@/lib/users/service'

export async function GET() {
  try {
    const auth = await requireAuth()
    const user = await getCurrentUser(auth)
    if (!user) throw new HttpError(404, 'Usuario no encontrado')
    return NextResponse.json(user)
  } catch (e) {
    return errorResponse(e)
  }
}
