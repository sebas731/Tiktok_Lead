import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api/response'
import { syncAllAutoCampaigns } from '@/lib/campaigns/sync'

/**
 * Sincronización programada de campañas Excel. Se protege con un bearer token
 * (CRON_SECRET). Lo invoca un cron externo del VPS, p. ej.:
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron/sync
 */
async function handle(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'CRON_SECRET no está configurado en el servidor' }, { status: 500 })
    }
    if (req.headers.get('authorization') !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json(await syncAllAutoCampaigns())
  } catch (e) {
    return errorResponse(e)
  }
}

export const POST = handle
export const GET = handle
