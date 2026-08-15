'use client'

import { useCallback, useEffect, useState } from 'react'
import { Table, type Column } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Donut, type DonutSegment } from '@/components/ui/Donut'
import { apiGet } from '@/lib/api/client'
import { STATUS_LABELS, SUBSTATUS_LABELS } from '@/lib/constants/leads'
import { userLabel, type Campaign, type Me, type ProcessedByAsesorRow, type ProcessedDetailRow } from '@/lib/types'

const STATUS_COLS = ['POSITIVO', 'NEGATIVO', 'AGENDADO', 'NO_CONTACTO']
const PALETTE = ['#a61c28', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#dc2626', '#4f46e5', '#0d9488', '#9333ea']

type ViewMode = 'tabla' | 'dona'

export function ProcessedLeadsView() {
  const [rows, setRows] = useState<ProcessedByAsesorRow[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [asesores, setAsesores] = useState<Me[]>([])
  const [campaignId, setCampaignId] = useState('')
  const [asesorId, setAsesorId] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [view, setView] = useState<ViewMode>('tabla')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Detalle de un asesor
  const [detailOf, setDetailOf] = useState<ProcessedByAsesorRow | null>(null)
  const [detail, setDetail] = useState<ProcessedDetailRow[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    apiGet<Campaign[]>('/api/campaigns').then(setCampaigns).catch(() => {})
    apiGet<Me[]>('/api/users?role=ASESOR').then(setAsesores).catch(() => {})
  }, [])

  const query = useCallback(() => {
    const p = new URLSearchParams()
    if (campaignId) p.set('campaignId', campaignId)
    if (asesorId) p.set('asesorId', asesorId)
    if (desde) p.set('desde', desde)
    if (hasta) p.set('hasta', hasta)
    return p.toString()
  }, [campaignId, asesorId, desde, hasta])

  const load = useCallback(() => {
    setLoading(true)
    apiGet<ProcessedByAsesorRow[]>(`/api/reports/processed?${query()}`)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [query])
  useEffect(load, [load])

  function openDetail(r: ProcessedByAsesorRow) {
    setDetailOf(r)
    setDetailLoading(true)
    const p = new URLSearchParams(query())
    p.set('asesorId', r.asesorId)
    apiGet<ProcessedDetailRow[]>(`/api/reports/processed/detail?${p.toString()}`)
      .then(setDetail)
      .catch(() => setDetail([]))
      .finally(() => setDetailLoading(false))
  }

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
    { key: 'ver', header: '', render: () => <span className="text-xs font-medium text-brand-red">Ver detalle →</span> },
  ]

  const detailColumns: Column<ProcessedDetailRow>[] = [
    { key: 'fecha', header: 'Fecha', render: (d) => new Date(d.processedAt).toLocaleString() },
    { key: 'lead', header: 'Lead', render: (d) => <span className="font-medium text-text">{d.leadNumber}</span> },
    { key: 'camp', header: 'Campaña', render: (d) => d.campaignName },
    { key: 'estado', header: 'Estado', render: (d) => STATUS_LABELS[d.status] ?? d.status },
    { key: 'sub', header: 'Sub-estado', render: (d) => SUBSTATUS_LABELS[d.subStatus] ?? d.subStatus },
    { key: 'obs', header: 'Observaciones', render: (d) => d.observations ?? '—' },
  ]

  return (
    <div>
      <PageHeader title="Leads procesados por asesor" description="Gestiones registradas por cada asesor. Haz clic en una fila para ver el detalle." />

      <div className="mb-4 inline-flex rounded-xl border border-border bg-surface p-1">
        {(['tabla', 'dona'] as ViewMode[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === v ? 'bg-brand-red text-white shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            {v === 'tabla' ? 'Tabla' : 'Dona'}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Select label="Campaña" value={campaignId} onChange={setCampaignId} placeholder="Todas"
            options={campaigns.map((c) => ({ value: c.campaign_id, label: c.name }))} />
        </div>
        <div className="w-56">
          <Select label="Asesor" value={asesorId} onChange={setAsesorId} placeholder="Todos"
            options={asesores.map((a) => ({ value: a.user_id, label: userLabel(a) }))} />
        </div>
        <DatePicker label="Desde" value={desde} onChange={setDesde} />
        <DatePicker label="Hasta" value={hasta} onChange={setHasta} />
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {view === 'tabla' ? (
        <Table columns={columns} rows={rows} getRowKey={(r) => r.asesorId} loading={loading} onRowClick={openDetail} emptyMessage="Sin gestiones en el rango." />
      ) : rows.length === 0 ? (
        <EmptyState title="Sin datos" description="No hay gestiones para graficar con estos filtros." />
      ) : (
        <div className="flex flex-col items-center gap-8 rounded-3xl border border-border/70 bg-surface p-6 shadow-soft sm:flex-row sm:items-start">
          <Donut segments={segments} />
          <ul className="flex-1 space-y-2">
            {rows.map((r, i) => {
              const pct = totalGeneral > 0 ? Math.round((r.total / totalGeneral) * 100) : 0
              return (
                <li key={r.asesorId}>
                  <button type="button" onClick={() => openDetail(r)} className="flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left text-sm hover:bg-bg">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span className="flex-1 truncate text-text">{r.asesorName}</span>
                    <span className="font-semibold text-text">{r.total}</span>
                    <span className="w-10 text-right text-text-muted">{pct}%</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {detailOf && (
        <Modal open size="xl" title={`Detalle — ${detailOf.asesorName} (${detailOf.total})`} onClose={() => setDetailOf(null)}>
          <Table columns={detailColumns} rows={detail} getRowKey={(d) => d.id} loading={detailLoading} emptyMessage="Sin gestiones." />
        </Modal>
      )}
    </div>
  )
}
