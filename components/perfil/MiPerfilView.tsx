'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet } from '@/lib/api/client'
import { FlameBadge } from './FlameBadge'

type Streaks = { salesStreak: number; dailyStreak: number; todaySales: number }

function StreakCard({
  variant,
  value,
  title,
  hint,
}: {
  variant: 'red' | 'purple'
  value: number
  title: string
  hint: string
}) {
  const ring = variant === 'red' ? 'border-orange-200' : 'border-purple-200'
  return (
    <div className={`flex flex-col items-center gap-2 rounded-3xl border ${ring} bg-surface p-6 text-center shadow-soft`}>
      <FlameBadge value={value} variant={variant} />
      <p className="text-sm font-semibold text-text">{title}</p>
      <p className="max-w-[16rem] text-xs text-text-muted">{hint}</p>
    </div>
  )
}

export function MiPerfilView({ name }: { name: string }) {
  const [streaks, setStreaks] = useState<Streaks | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet<Streaks>('/api/me/streaks')
      .then(setStreaks)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [])

  return (
    <div>
      <PageHeader title="Mi perfil" description={name} />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StreakCard
          variant="red"
          value={streaks?.salesStreak ?? 0}
          title="Racha de ventas"
          hint="Ventas seguidas hoy. Se corta con un NO_CONTACTO o NEGATIVO."
        />
        <StreakCard
          variant="purple"
          value={streaks?.dailyStreak ?? 0}
          title="Racha diaria"
          hint="Días seguidos con al menos una venta. Los domingos no cuentan."
        />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-muted">
        Hoy llevas <span className="font-semibold text-text">{streaks?.todaySales ?? 0}</span> venta(s).
      </div>

      <p className="mt-6 text-xs text-text-muted">Próximamente: medallas (mejor del día, mejor del mes y récord).</p>
    </div>
  )
}
