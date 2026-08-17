'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, type Column } from '@/components/ui/Table'
import { apiGet } from '@/lib/api/client'
import type { Campaign } from '@/lib/types'
import type { Breakdown } from '@/components/campaigns/CampaignStats'

type Row = Breakdown & { name: string; total: number }

export function PanelView() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiGet<Campaign[]>('/api/campaigns'),
      apiGet<Record<string, Breakdown>>('/api/leads/stats'),
    ])
      .then(([camps, stats]) => {
        setRows(
          camps.map((c) => {
            const b = stats[c.campaign_id] ?? { campaignId: c.campaign_id, sinGestion: 0, noContacto: 0, agendado: 0, positivoSinVenta: 0, negativo: 0 }
            const total = b.sinGestion + b.noContacto + b.agendado + b.positivoSinVenta + b.negativo
            return { ...b, name: c.name, total }
          }),
        )
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  const num = (n: number) => <span className="font-semibold text-text">{n}</span>
  const columns: Column<Row>[] = [
    { key: 'name', header: 'Campaña', render: (r) => <span className="font-medium text-text">{r.name}</span> },
    { key: 'sg', header: 'Sin gestión', render: (r) => num(r.sinGestion) },
    { key: 'nc', header: 'No contacto', render: (r) => num(r.noContacto) },
    { key: 'ag', header: 'Agendados', render: (r) => num(r.agendado) },
    { key: 'psv', header: 'Pos. sin venta', render: (r) => num(r.positivoSinVenta) },
    { key: 'neg', header: 'Negativos', render: (r) => num(r.negativo) },
    { key: 'tot', header: 'Total', render: (r) => <span className="font-bold text-brand-red">{r.total}</span> },
  ]

  const t = rows.reduce(
    (a, r) => ({
      sinGestion: a.sinGestion + r.sinGestion,
      noContacto: a.noContacto + r.noContacto,
      agendado: a.agendado + r.agendado,
      positivoSinVenta: a.positivoSinVenta + r.positivoSinVenta,
      negativo: a.negativo + r.negativo,
      total: a.total + r.total,
    }),
    { sinGestion: 0, noContacto: 0, agendado: 0, positivoSinVenta: 0, negativo: 0, total: 0 },
  )

  return (
    <div>
      <PageHeader title="Panel de control" description="Tratamiento de los leads por campaña. Haz clic en una fila para ver sus leads." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { l: 'Sin gestión', v: t.sinGestion },
          { l: 'No contacto', v: t.noContacto },
          { l: 'Agendados', v: t.agendado },
          { l: 'Pos. sin venta', v: t.positivoSinVenta },
          { l: 'Negativos', v: t.negativo },
          { l: 'Total', v: t.total },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-surface p-3 text-center shadow-soft">
            <p className="text-2xl font-bold text-text">{s.v}</p>
            <p className="text-[11px] text-text-muted">{s.l}</p>
          </div>
        ))}
      </div>

      <Table
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.campaignId}
        loading={loading}
        onRowClick={(r) => router.push(`/dashboard/campaigns/${r.campaignId}/leads`)}
        emptyMessage="Sin campañas."
      />
    </div>
  )
}
