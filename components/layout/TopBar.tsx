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
}

export function TopBar({ name, role, sedes = [], activeSede = '', onChangeSede }: TopBarProps) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-3 z-30 mx-3 mt-3 flex h-14 items-center justify-between rounded-2xl border border-border/70 bg-surface/80 px-5 shadow-soft backdrop-blur-md">
      <div>
        {sedes.length > 0 && onChangeSede && (
          <select
            value={activeSede}
            onChange={(e) => onChangeSede(e.target.value)}
            className="rounded-xl border border-border bg-bg/60 px-3.5 py-2 text-sm outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
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
          <div className="text-right leading-tight">
            <p className="text-sm font-semibold text-text">{name}</p>
            <p className="text-[11px] uppercase tracking-wide text-text-muted">{role}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={logout}>Salir</Button>
      </div>
    </header>
  )
}
