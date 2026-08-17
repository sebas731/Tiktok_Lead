import { prisma } from '@/lib/prisma'
import { LEAD_STATUS } from '@/lib/generated/prisma/client'

// Perú no tiene horario de verano: zona fija UTC-5.
const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000

type LimaParts = { key: string; dow: number } // dow: 0 = domingo

/** Fecha calendario de Lima (YYYY-MM-DD) y día de la semana de un instante UTC. */
function limaParts(d: Date): LimaParts {
  const t = new Date(d.getTime() - LIMA_OFFSET_MS)
  const key = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`
  return { key, dow: t.getUTCDay() }
}

/** Instante UTC correspondiente a la medianoche (00:00) de ese día en Lima. */
function limaDayStartUtc(key: string): Date {
  return new Date(`${key}T05:00:00.000Z`)
}

export type AsesorStreaks = {
  /** Ventas seguidas HOY (se corta con un NEGATIVO/NO_CONTACTO). Llama roja. */
  salesStreak: number
  /** Días seguidos con al menos 1 venta, sin contar domingos. Llama morada. */
  dailyStreak: number
  /** Ventas de hoy (para mostrar de apoyo). */
  todaySales: number
}

const VENTA = LEAD_STATUS.POSITIVO
const CORTAN = [LEAD_STATUS.POSITIVO, LEAD_STATUS.NEGATIVO, LEAD_STATUS.NO_CONTACTO]

/**
 * Calcula las rachas del asesor EN VIVO desde su historial de gestiones
 * (LeadProcessLog). Una "venta" es dejar el lead en POSITIVO.
 * No persiste nada: se recalcula al consultarse.
 */
export async function getAsesorStreaks(userId: string): Promise<AsesorStreaks> {
  const todayKey = limaParts(new Date()).key

  // --- Racha de ventas seguidas HOY ---
  // Gestiones decisivas de hoy en orden: POSITIVO suma, NEGATIVO/NO_CONTACTO cortan.
  // (AGENDADO no entra: es neutral, no suma ni corta.)
  const hoy = await prisma.leadProcessLog.findMany({
    where: { userId, processedAt: { gte: limaDayStartUtc(todayKey) }, status: { in: CORTAN } },
    orderBy: { processedAt: 'asc' },
    select: { status: true },
  })
  let salesStreak = 0
  let todaySales = 0
  for (const l of hoy) {
    if (l.status === VENTA) {
      salesStreak++
      todaySales++
    } else {
      salesStreak = 0
    }
  }

  // --- Racha diaria (días trabajados seguidos con >=1 venta, domingos no cuentan) ---
  const ventas = await prisma.leadProcessLog.findMany({
    where: { userId, status: VENTA },
    select: { processedAt: true },
  })
  const diasConVenta = new Set(ventas.map((v) => limaParts(v.processedAt).key))

  let dailyStreak = 0
  let cursor = limaDayStartUtc(todayKey)
  for (let i = 0; i < 3660; i++) {
    const { key, dow } = limaParts(cursor)
    if (dow === 0) {
      // Domingo: se salta, ni corta ni cuenta.
    } else if (diasConVenta.has(key)) {
      dailyStreak++
    } else if (key !== todayKey) {
      // Un día laborable pasado sin venta corta la racha. Hoy no corta (en curso).
      break
    }
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000)
  }

  return { salesStreak, dailyStreak, todaySales }
}
