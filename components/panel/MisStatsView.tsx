'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet } from '@/lib/api/client'

type Stats = { nuevos3min: number; disponibles: number; misPendientes: number }

function Big({ value, title, hint, tone }: { value: number; title: string; hint: string; tone: string }) {
  return (
    <div className={`rounded-3xl border p-6 text-center shadow-soft ${tone}`}>
      <p className="text-4xl font-black text-text">{value}</p>
      <p className="mt-1 text-sm font-semibold text-text">{title}</p>
      <p className="mt-0.5 text-xs text-text-muted">{hint}</p>
    </div>
  )
}

export function MisStatsView() {
  const [s, setS] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    apiGet<Stats>('/api/me/lead-stats').then(setS).catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [])

  useEffect(() => {
    load()
    // Refresca cada 30 s para que "últimos 3 min" y el pool estén al día.
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  return (
    <div>
      <PageHeader title="Mis estadísticas" description="Detalle de tus leads (se actualiza solo)." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Big
          value={s?.nuevos3min ?? 0}
          title="Nuevos (últimos 3 min)"
          hint="Leads sin gestión que cayeron recién en tus campañas."
          tone="border-emerald-200"
        />
        <Big
          value={s?.disponibles ?? 0}
          title="Sin gestión disponibles"
          hint="Leads nuevos en el pool listos para tomar."
          tone="border-amber-200"
        />
        <Big
          value={s?.misPendientes ?? 0}
          title="Mis pendientes"
          hint="Leads asignados a ti por atender."
          tone="border-blue-200"
        />
      </div>
    </div>
  )
}
