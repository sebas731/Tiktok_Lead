import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { errorResponse, readJson, requireString } from '@/lib/api/response'
import { listSheetTabs } from '@/lib/services/googleSheets'

/** Devuelve las pestañas del documento: [{ gid, title, index }]. */
export async function POST(req: NextRequest) {
  try {
    await requireRole(['ADMIN'])
    const body = await readJson<Record<string, unknown>>(req)
    const url = requireString(body.url, 'url')
    return NextResponse.json(await listSheetTabs(url))
  } catch (e) {
    return errorResponse(e)
  }
}
