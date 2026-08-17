import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api/response'
import { releaseExpiredAgendados } from '@/lib/leads/service'

/**
 * Suelta los AGENDADO cuya reserva de 24 h ya venció (los desasigna y devuelve al
 * pool). Protegido con CRON_SECRET. Invocar desde un cron externo, p. ej. cada hora:
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron/release-agendados
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
    const released = await releaseExpiredAgendados()
    return NextResponse.json({ released })
  } catch (e) {
    return errorResponse(e)
  }
}

export const POST = handle
export const GET = handle
