'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

type Sede = { sede_id: string; code: string; name: string }

type TopBarProps = {
  name: string
  role: string
  sedes?: Sede[]
  activeSede?: string
  onChangeSede?: (id: string) => void
  onOpenMenu?: () => void
}

export function TopBar({ name, role, sedes = [], activeSede = '', onChangeSede, onOpenMenu }: TopBarProps) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-3 z-30 mx-3 mt-3 flex h-14 items-center justify-between gap-2 rounded-2xl border border-border/70 bg-surface/80 px-3 shadow-soft backdrop-blur-md sm:px-5">
      <div className="flex items-center gap-2">
        {/* Abrir menú (solo móvil) */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-black/5 hover:text-text lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        {sedes.length > 0 && onChangeSede && (
          <select
            value={activeSede}
            onChange={(e) => onChangeSede(e.target.value)}
            className="max-w-[45vw] rounded-xl border border-border bg-bg/60 px-3 py-2 text-sm outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15 sm:max-w-none sm:px-3.5"
          >
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s.sede_id} value={s.sede_id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl bg-bg/60 py-1 pl-1 pr-3 ring-1 ring-border/70">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-brand-red-dk text-xs font-bold text-white">
            {name.trim().slice(0, 2).toUpperCase()}
          </span>
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-semibold text-text">{name}</p>
            <p className="text-[11px] uppercase tracking-wide text-text-muted">{role}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={logout}>Salir</Button>
      </div>
    </header>
  )
}
