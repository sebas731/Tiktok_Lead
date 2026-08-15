'use client'

import { useCallback, useEffect, useState } from 'react'
import { Table, type Column } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Donut, type DonutSegment } from '@/components/ui/Donut'
import { apiGet } from '@/lib/api/client'
import { STATUS_LABELS } from '@/lib/constants/leads'
import type { Campaign, ProcessedByAsesorRow } from '@/lib/types'

const STATUS_COLS = ['POSITIVO', 'NEGATIVO', 'AGENDADO', 'NO_CONTACTO']
const PALETTE = ['#a61c28', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#dc2626', '#4f46e5', '#0d9488', '#9333ea']

type ViewMode = 'tabla' | 'dona'

export function ProcessedLeadsView() {
  const [rows, setRows] = useState<ProcessedByAsesorRow[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignId, setCampaignId] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [view, setView] = useState<ViewMode>('tabla')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet<Campaign[]>('/api/campaigns').then(setCampaigns).catch(() => {})
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (campaignId) p.set('campaignId', campaignId)
    if (desde) p.set('desde', desde)
    if (hasta) p.set('hasta', hasta)
    apiGet<ProcessedByAsesorRow[]>(`/api/reports/processed?${p.toString()}`)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [campaignId, desde, hasta])
  useEffect(load, [load])

  const totalGeneral = rows.reduce((a, r) => a + r.total, 0)
  const segments: DonutSegment[] = rows.map((r, i) => ({ label: r.asesorName, value: r.total, color: PALETTE[i % PALETTE.length] }))

  const columns: Column<ProcessedByAsesorRow>[] = [
    { key: 'n', header: '#', render: (r) => String(rows.indexOf(r) + 1) },
    { key: 'asesor', header: 'Asesor', render: (r) => <span className="font-medium text-text">{r.asesorName}</span> },
    { key: 'total', header: 'Total', render: (r) => <span className="font-semibold text-text">{r.total}</span> },
    ...STATUS_COLS.map((st) => ({
      key: st,
      header: STATUS_LABELS[st] ?? st,
      render: (r: ProcessedByAsesorRow) => r.byStatus[st] ?? 0,
    })),
  ]

  return (
    <div>
      <PageHeader title="Leads procesados por asesor" description="Gestiones registradas por cada asesor." />

      <div className="mb-4 inline-flex rounded-xl border border-border bg-surface p-1">
        {(['tabla', 'dona'] as ViewMode[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
              view === v ? 'bg-brand-red text-white shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            {v === 'tabla' ? 'Tabla' : 'Dona'}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Select
            label="Campaña"
            value={campaignId}
            onChange={setCampaignId}
            placeholder="Todas"
            options={campaigns.map((c) => ({ value: c.campaign_id, label: c.name }))}
          />
        </div>
        <DatePicker label="Desde" value={desde} onChange={setDesde} />
        <DatePicker label="Hasta" value={hasta} onChange={setHasta} />
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {view === 'tabla' ? (
        <Table columns={columns} rows={rows} getRowKey={(r) => r.asesorId} loading={loading} emptyMessage="Sin gestiones en el rango." />
      ) : rows.length === 0 ? (
        <EmptyState title="Sin datos" description="No hay gestiones para graficar con estos filtros." />
      ) : (
        <div className="flex flex-col items-center gap-8 rounded-3xl border border-border/70 bg-surface p-6 shadow-soft sm:flex-row sm:items-start">
          <Donut segments={segments} />
          <ul className="flex-1 space-y-2">
            {rows.map((r, i) => {
              const pct = totalGeneral > 0 ? Math.round((r.total / totalGeneral) * 100) : 0
              return (
                <li key={r.asesorId} className="flex items-center gap-3 text-sm">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className="flex-1 truncate text-text">{r.asesorName}</span>
                  <span className="font-semibold text-text">{r.total}</span>
                  <span className="w-10 text-right text-text-muted">{pct}%</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
