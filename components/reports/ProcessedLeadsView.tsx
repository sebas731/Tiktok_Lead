'use client'

import { useCallback, useEffect, useState } from 'react'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Donut, type DonutSegment } from '@/components/ui/Donut'
import { apiGet } from '@/lib/api/client'
import { STATUS_LABELS, STATUS_OPTIONS, SUBSTATUS_LABELS } from '@/lib/constants/leads'
import { userLabel, type Campaign, type Me, type ProcessedByAsesorRow, type ProcessedDetailRow } from '@/lib/types'

const STATUS_COLS = ['POSITIVO', 'NEGATIVO', 'AGENDADO', 'NO_CONTACTO']
const PALETTE = ['#a61c28', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#dc2626', '#4f46e5', '#0d9488', '#9333ea']

type ViewMode = 'tabla' | 'dona' | 'detalle'
const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'tabla', label: 'Tabla' },
  { id: 'dona', label: 'Dona' },
  { id: 'detalle', label: 'Detalle' },
]

export function ProcessedLeadsView() {
  const [rows, setRows] = useState<ProcessedByAsesorRow[]>([])
  const [flat, setFlat] = useState<ProcessedDetailRow[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [asesores, setAsesores] = useState<Me[]>([])
  const [campaignId, setCampaignId] = useState('')
  const [asesorId, setAsesorId] = useState('')
  const [status, setStatus] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [view, setView] = useState<ViewMode>('tabla')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [detailOf, setDetailOf] = useState<ProcessedByAsesorRow | null>(null)
  const [detail, setDetail] = useState<ProcessedDetailRow[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    apiGet<Campaign[]>('/api/campaigns').then(setCampaigns).catch(() => {})
    apiGet<Me[]>('/api/users?role=ASESOR').then(setAsesores).catch(() => {})
  }, [])

  const query = useCallback(() => {
    const p = new URLSearchParams()
    if (campaignId) p.set('campaignId', campaignId)
    if (asesorId) p.set('asesorId', asesorId)
    if (status) p.set('status', status)
    if (desde) p.set('desde', desde)
    if (hasta) p.set('hasta', hasta)
    return p.toString()
  }, [campaignId, asesorId, status, desde, hasta])

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    if (view === 'detalle') {
      apiGet<ProcessedDetailRow[]>(`/api/reports/processed/detail?${query()}`)
        .then(setFlat)
        .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
        .finally(() => setLoading(false))
    } else {
      apiGet<ProcessedByAsesorRow[]>(`/api/reports/processed?${query()}`)
        .then(setRows)
        .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
        .finally(() => setLoading(false))
    }
  }, [query, view])
  useEffect(load, [load])

  async function exportExcel() {
    setExporting(true)
    setError('')
    try {
      const data = await apiGet<ProcessedDetailRow[]>(`/api/reports/processed/detail?${query()}`)
      const headers = ['Fecha', 'Supervisor', 'Asesor', 'DNI', 'ID Lead', 'Código', 'Número', 'Campaña', 'Estado', 'Sub-estado', 'Motivo', 'Observaciones']
      // Escapa caracteres HTML para que la tabla no se rompa.
      const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // mso-number-format:\@ fuerza a Excel a tratar todo como TEXTO (no rompe teléfonos/DNI).
      const cell = (v: unknown) => `<td style="mso-number-format:'\\@'">${esc(v)}</td>`
      const body = data
        .map((r) => `<tr>${[
          new Date(r.processedAt).toLocaleString(),
          r.supervisorName, r.asesorName, r.asesorDni, r.leadId.slice(0, 8),
          r.saleCode ?? '', r.leadNumber, r.campaignName,
          STATUS_LABELS[r.status] ?? r.status, SUBSTATUS_LABELS[r.subStatus] ?? r.subStatus,
          r.reason || '', r.observations ?? '',
        ].map(cell).join('')}</tr>`)
        .join('')
      const html =
        `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>` +
        `<table border="1"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>` +
        `</body></html>`
      // El BOM (\ufeff) asegura que Excel lea bien las tildes.
      const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-procesados-${new Date().toISOString().slice(0, 10)}.xls`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al exportar')
    } finally {
      setExporting(false)
    }
  }

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
    { key: 'asesor', header: 'Asesor', render: (r) => <span className="font-medium text-text">{r.asesorName}</span> },
    { key: 'dni', header: 'DNI', render: (r) => <span className="font-mono text-xs">{r.asesorDni}</span> },
    { key: 'total', header: 'Total', render: (r) => <span className="font-semibold text-text">{r.total}</span> },
    ...STATUS_COLS.map((st) => ({
      key: st,
      header: STATUS_LABELS[st] ?? st,
      render: (r: ProcessedByAsesorRow) => r.byStatus[st] ?? 0,
    })),
    { key: 'ver', header: '', render: () => <span className="text-xs font-medium text-brand-red">Ver detalle →</span> },
  ]

  const flatColumns: Column<ProcessedDetailRow>[] = [
    { key: 'asesor', header: 'Asesor', render: (d) => <span className="font-medium text-text">{d.asesorName}</span> },
    { key: 'dni', header: 'DNI', render: (d) => <span className="font-mono text-xs">{d.asesorDni}</span> },
    { key: 'lead', header: 'Lead', render: (d) => d.leadNumber },
    { key: 'camp', header: 'Campaña', render: (d) => d.campaignName },
    { key: 'estado', header: 'Estado', render: (d) => STATUS_LABELS[d.status] ?? d.status },
    { key: 'sub', header: 'Sub-estado', render: (d) => SUBSTATUS_LABELS[d.subStatus] ?? d.subStatus },
    { key: 'fecha', header: 'Fecha', render: (d) => new Date(d.processedAt).toLocaleString() },
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
      <PageHeader
        title="Leads procesados por asesor"
        description="Gestiones registradas por cada asesor."
        actions={<Button onClick={exportExcel} loading={exporting}>Exportar Excel</Button>}
      />

      <div className="mb-4 inline-flex rounded-xl border border-border bg-surface p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === v.id ? 'bg-brand-red text-white shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-52">
          <Select label="Campaña" value={campaignId} onChange={setCampaignId} placeholder="Todas" clearable
            options={campaigns.map((c) => ({ value: c.campaign_id, label: c.name }))} />
        </div>
        <div className="w-52">
          <Select label="Asesor" value={asesorId} onChange={setAsesorId} placeholder="Todos" clearable
            options={asesores.map((a) => ({ value: a.user_id, label: userLabel(a) }))} />
        </div>
        <div className="w-44">
          <Select label="Estado" value={status} onChange={setStatus} placeholder="Todos" clearable options={STATUS_OPTIONS} />
        </div>
        <DatePicker label="Desde" value={desde} onChange={setDesde} />
        <DatePicker label="Hasta" value={hasta} onChange={setHasta} />
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {view === 'detalle' ? (
        <Table columns={flatColumns} rows={flat} getRowKey={(d) => d.id} loading={loading} emptyMessage="Sin gestiones con estos filtros." />
      ) : view === 'tabla' ? (
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
        <Modal open size="xl" title={`Detalle — ${detailOf.asesorName} (${detailOf.asesorDni})`} onClose={() => setDetailOf(null)}>
          <Table columns={detailColumns} rows={detail} getRowKey={(d) => d.id} loading={detailLoading} emptyMessage="Sin gestiones." />
        </Modal>
      )}
    </div>
  )
}
