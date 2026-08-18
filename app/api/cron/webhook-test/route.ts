import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api/response'
import { WebhookLeads } from '@/lib/webhooks/service'

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    await WebhookLeads()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return errorResponse(e)
  }
}
export const POST = handle
export const GET = handle