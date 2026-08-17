'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '@/lib/api/client'

type Streaks = { salesStreak: number; dailyStreak: number; todaySales: number }

/** Evento global para refrescar las rachas tras una gestión (venta / soltar). */
export const STREAKS_REFRESH = 'ck2:streaks-refresh'

const PALETTE = {
  red: { outer: '#ef4444', core: '#fde047', glow: 'rgba(249,115,22,.5)' },
  purple: { outer: '#7c3aed', core: '#e9d5ff', glow: 'rgba(168,85,247,.5)' },
} as const

function MiniFlame({ value, variant, legend }: { value: number; variant: 'red' | 'purple'; legend: string }) {
  const c = PALETTE[variant]
  return (
    <span className="group relative flex items-center gap-1 rounded-full bg-bg/70 px-2 py-1 ring-1 ring-border/70">
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <span className="sc-glow absolute h-4 w-4 rounded-full blur-md" style={{ background: c.glow }} />
        <svg viewBox="0 0 24 30" className="relative h-full w-full">
          <path className="sc-flame" fill={c.outer} d="M12 1c1.2 3.6 4.2 5.4 4.2 10 0 4.5-2.6 7.7-7.2 7.7S2 15.5 2 11c0-2.5 1-4.2 2.5-5.7.3 1.8 1.4 2.6 2.4 2.2C10 6.9 10.4 4.3 9.6 1.3 13 2.4 15 5 16 8.6c.2-2-.2-3.6 0-5.6z" transform="translate(0 1)" />
          <path className="sc-core" fill={c.core} d="M12 12c.7 1.8 2 2.7 2 4.8 0 2.2-1.4 3.7-3.5 3.7S7 19 7 16.8c0-1.3.6-2.2 1.4-3 .1.9.7 1.2 1.2 1 .5-.2.6-1.3.4-2.8z" transform="translate(0 2)" />
        </svg>
      </span>
      <span className="text-sm font-bold text-text">{value}</span>

      {/* Leyenda al pasar el mouse */}
      <span className="pointer-events-none absolute right-0 top-9 z-40 hidden w-56 rounded-lg border border-border bg-surface p-2.5 text-xs font-normal text-text shadow-lg group-hover:block">
        {legend}
      </span>
    </span>
  )
}

/** Rachas del asesor en la barra superior. Solo se renderiza para asesores. */
export function StreakChips() {
  const [s, setS] = useState<Streaks | null>(null)
  const load = useCallback(() => {
    apiGet<Streaks>('/api/me/streaks').then(setS).catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    window.addEventListener(STREAKS_REFRESH, load as EventListener)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(STREAKS_REFRESH, load as EventListener)
    }
  }, [load])

  if (!s) return null

  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <style>{`
        @keyframes sc-flame { 0%,100%{transform:scale(1,1) rotate(-1deg)} 50%{transform:scale(.94,1.07) rotate(1.5deg)} }
        @keyframes sc-core { 0%,100%{transform:scale(1);opacity:.95} 50%{transform:scale(1.1);opacity:.85} }
        @keyframes sc-glow { 0%,100%{opacity:.45} 50%{opacity:.85} }
        .sc-flame{transform-origin:50% 90%;animation:sc-flame 1s ease-in-out infinite}
        .sc-core{transform-origin:50% 85%;animation:sc-core .8s ease-in-out infinite}
        .sc-glow{animation:sc-glow 1.2s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){ .sc-flame,.sc-core,.sc-glow{animation:none} }
      `}</style>
      <MiniFlame variant="red" value={s.salesStreak} legend="Racha de ventas: ventas seguidas hoy. Se corta con un NO_CONTACTO o NEGATIVO." />
      <MiniFlame variant="purple" value={s.dailyStreak} legend="Racha diaria: días seguidos con al menos una venta. Los domingos no cuentan." />
    </div>
  )
}
