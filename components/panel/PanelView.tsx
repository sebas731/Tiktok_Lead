'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Badge, leadStatusTone } from '@/components/ui/Badge'
import { apiGet } from '@/lib/api/client'
import { STATUS_LABELS, STATUS_OPTIONS, SUBSTATUS_LABELS } from '@/lib/constants/leads'
import type { Campaign } from '@/lib/types'
import type { Breakdown } from '@/components/campaigns/CampaignStats'

type Row = Breakdown & { name: string }
type DetailRow = { id: string; client_number: string; status: string; sub_status: string; createdAt: string; campaignName: string; asesorName: string | null }
type DetailResp = { rows: DetailRow[]; total: number; page: number; totalPages: number }

const KPI = ({ v, l }: { v: number | string; l: string }) => (
  <div className="rounded-2xl border border-border bg-surface p-3 text-center shadow-soft">
    <p className="text-2xl font-bold text-text">{v}</p>
    <p className="text-[11px] text-text-muted">{l}</p>
  </div>
)

export function PanelView() {
  const router = useRouter()
  const [view, setView] = useState<'resumen' | 'detalle'>('resumen')
  const [rows, setRows] = useState<Row[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Filtros del detalle
  const [dCampaign, setDCampaign] = useState('')
  const [dStatus, setDStatus] = useState('')
  const [dOrder, setDOrder] = useState<'asc' | 'desc'>('asc')
  const [dPage, setDPage] = useState(1)
  const [detail, setDetail] = useState<DetailResp | null>(null)

  useEffect(() => {
    Promise.all([
      apiGet<Campaign[]>('/api/campaigns'),
      apiGet<Record<string, Breakdown>>('/api/leads/stats'),
    ])
      .then(([camps, stats]) => {
        setCampaigns(camps)
        setRows(camps.map((c) => ({
          ...(stats[c.campaign_id] ?? { campaignId: c.campaign_id, sinGestion: 0, noContacto: 0, agendado: 0, positivo: 0, positivoSinVenta: 0, negativo: 0, nuevos5min: 0, total: 0 }),
          name: c.name,
        })))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  const loadDetail = useCallback(() => {
    const p = new URLSearchParams({ page: String(dPage), order: dOrder })
    if (dCampaign) p.set('campaignId', dCampaign)
    if (dStatus) p.set('status', dStatus)
    apiGet<DetailResp>(`/api/leads/detail?${p.toString()}`).then(setDetail).catch(() => {})
  }, [dPage, dOrder, dCampaign, dStatus])
  useEffect(() => { if (view === 'detalle') loadDetail() }, [view, loadDetail])

  const totals = rows.reduce((a, r) => ({ total: a.total + r.total, nuevos: a.nuevos + r.nuevos5min }), { total: 0, nuevos: 0 })
  const promedio = rows.length > 0 ? Math.round(totals.total / rows.length) : 0

  const num = (n: number) => <span className="font-semibold text-text">{n}</span>
  const summaryCols: Column<Row>[] = [
    { key: 'name', header: 'Campaña', render: (r) => <span className="font-medium text-text">{r.name}</span> },
    { key: 'nv', header: 'Nuevos 5m', render: (r) => <span className={r.nuevos5min > 0 ? 'font-bold text-emerald-600' : 'text-text-muted'}>{r.nuevos5min}</span> },
    { key: 'sg', header: 'Sin gestión', render: (r) => num(r.sinGestion) },
    { key: 'nc', header: 'No contacto', render: (r) => num(r.noContacto) },
    { key: 'ag', header: 'Agendados', render: (r) => num(r.agendado) },
    { key: 'psv', header: 'Pos. sin venta', render: (r) => num(r.positivoSinVenta) },
    { key: 'neg', header: 'Negativos', render: (r) => num(r.negativo) },
    { key: 'tot', header: 'Total', render: (r) => <span className="font-bold text-brand-red">{r.total}</span> },
  ]

  const detailCols: Column<DetailRow>[] = [
    { key: 'num', header: 'Número', render: (d) => <span className="font-mono text-text">{d.client_number}</span> },
    { key: 'camp', header: 'Campaña', render: (d) => d.campaignName },
    { key: 'est', header: 'Estado', render: (d) => <Badge tone={leadStatusTone(d.status)}>{STATUS_LABELS[d.status] ?? d.status}</Badge> },
    { key: 'sub', header: 'Sub-estado', render: (d) => SUBSTATUS_LABELS[d.sub_status] ?? d.sub_status },
    { key: 'ase', header: 'Asesor', render: (d) => d.asesorName ?? '—' },
    { key: 'cre', header: 'Creado', render: (d) => new Date(d.createdAt).toLocaleString() },
  ]

  return (
    <div>
      <PageHeader title="Panel de control" description="Tratamiento de los leads por campaña. Consulta el detalle de cada lead." />

      <div className="mb-4 inline-flex rounded-xl border border-border bg-surface p-1">
        {(['resumen', 'detalle'] as const).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${view === v ? 'bg-brand-red text-white shadow-sm' : 'text-text-muted hover:text-text'}`}>
            {v}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {view === 'resumen' ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KPI v={totals.total} l="Total de leads" />
            <KPI v={promedio} l="Promedio por campaña" />
            <KPI v={totals.nuevos} l="Nuevos (últimos 5 min)" />
            <KPI v={rows.length} l="Campañas" />
          </div>
          <Table columns={summaryCols} rows={rows} getRowKey={(r) => r.campaignId} loading={loading}
            onRowClick={(r) => router.push(`/dashboard/campaigns/${r.campaignId}/leads`)}
            emptyMessage="Sin campañas." />
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="w-52">
              <Select label="Campaña" value={dCampaign} onChange={(v) => { setDCampaign(v); setDPage(1) }} placeholder="Todas" clearable
                options={campaigns.map((c) => ({ value: c.campaign_id, label: c.name }))} />
            </div>
            <div className="w-44">
              <Select label="Estado" value={dStatus} onChange={(v) => { setDStatus(v); setDPage(1) }} placeholder="Todos" clearable options={STATUS_OPTIONS} />
            </div>
            <div className="w-52">
              <Select label="Orden (por creación)" value={dOrder} onChange={(v) => { setDOrder(v as 'asc' | 'desc'); setDPage(1) }}
                options={[{ value: 'asc', label: 'Más viejos primero' }, { value: 'desc', label: 'Más nuevos primero' }]} />
            </div>
          </div>
          <Table columns={detailCols} rows={detail?.rows ?? []} getRowKey={(d) => d.id} emptyMessage="Sin leads con estos filtros." />
          <Pagination page={detail?.page ?? 1} totalPages={detail?.totalPages ?? 1} onChange={setDPage} />
          {detail && <p className="mt-2 text-xs text-text-muted">{detail.total} lead(s) en total.</p>}
        </>
      )}
    </div>
  )
}
