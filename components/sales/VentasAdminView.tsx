'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { DatePicker } from '@/components/ui/DatePicker'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSede } from '@/components/layout/SedeContext'
import { apiGet } from '@/lib/api/client'
import { SALE_STATUS_LABELS, SALE_STATUS_OPTIONS, subStatusLabel } from '@/lib/constants/saleStatus'
import type { Grupo, Role, SaleRow } from '@/lib/types'
import { SaleStatusModal } from './SaleStatusModal'
import { SaleGlassEditModal } from './SaleGlassEditModal'
import { SalesGroupGrid, type GroupVariant, type SaleGroup } from './SalesGroupGrid'

type ViewMode = 'table' | 'campaign' | 'sede' | 'sala'

const VIEW_TABS: { value: ViewMode; label: string }[] = [
  { value: 'table', label: 'Tabla' },
  { value: 'campaign', label: 'Por campaña' },
  { value: 'sede', label: 'Por sede' },
  { value: 'sala', label: 'Por sala' },
]

export function VentasAdminView({ role }: { role: Role }) {
  const router = useRouter()
  const canEdit = role === 'ADMIN' || role === 'BACK'
  const canRegister = role === 'BACK' || role === 'SUPERVISOR'
  const { activeSede } = useSede()
  const [sales, setSales] = useState<SaleRow[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  // El BACK y el SUPERVISOR aterrizan en tarjetas por sede; el resto en tabla.
  const [view, setView] = useState<ViewMode>(role === 'BACK' || role === 'SUPERVISOR' ? 'sede' : 'table')
  const [drill, setDrill] = useState<string | null>(null)
  const isSupervisor = role === 'SUPERVISOR'
  const [scope, setScope] = useState('sede')
  const [reason, setReason] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [statusSale, setStatusSale] = useState<SaleRow | null>(null)
  const [editSale, setEditSale] = useState<SaleRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (activeSede) p.set('sedeId', activeSede)
    if (reason) p.set('reason', reason)
    if (desde) p.set('fechaDesde', desde)
    if (hasta) p.set('fechaHasta', hasta)
    if (isSupervisor && scope !== 'sede') p.set('scope', scope)
    apiGet<SaleRow[]>(`/api/sales?${p.toString()}`)
      .then(setSales)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [activeSede, reason, desde, hasta, isSupervisor, scope])
  useEffect(load, [load])

  useEffect(() => {
    apiGet<Grupo[]>('/api/grupos').then(setGrupos).catch(() => {})
  }, [])

  const salaByAsesor = useMemo(() => {
    const m = new Map<string, { grupoId: string; name: string; supervisor: string; members: number; sede: string }>()
    for (const g of grupos) {
      const info = {
        grupoId: g.grupo_id,
        name: g.name,
        supervisor: g.supervisor?.name ?? '—',
        members: g.members.length,
        sede: g.sede?.name ?? '—',
      }
      for (const mem of g.members) m.set(mem.asesor.user_id, info)
    }
    return m
  }, [grupos])

  const groups = useMemo<SaleGroup[]>(() => {
    if (view === 'table') return []
    const map = new Map<string, SaleGroup>()
    const push = (base: Omit<SaleGroup, 'sales'>, s: SaleRow) => {
      const g = map.get(base.key)
      if (g) g.sales.push(s)
      else map.set(base.key, { ...base, sales: [s] })
    }
    for (const s of sales) {
      if (view === 'campaign') {
        push({ key: s.campaign?.campaign_id ?? 'sin', title: s.campaign?.name ?? 'Sin campaña' }, s)
      } else if (view === 'sede') {
        push({ key: s.sede?.sede_id ?? 'sin', title: s.sede?.name ?? s.sede?.code ?? 'Sin sede', subtitle: s.sede?.code }, s)
      } else {
        const sala = s.advisor ? salaByAsesor.get(s.advisor.user_id) : undefined
        if (sala) push({ key: sala.grupoId, title: sala.name, subtitle: `Sup. ${sala.supervisor}`, members: sala.members, sede: sala.sede }, s)
        else push({ key: 'sin', title: 'Sin sala', subtitle: 'Asesores sin grupo' }, s)
      }
    }
    return [...map.values()].sort((a, b) => b.sales.length - a.sales.length)
  }, [view, sales, salaByAsesor])

  const drilled = drill ? groups.find((g) => g.key === drill) ?? null : null

  const changeView = (v: ViewMode) => {
    setView(v)
    setDrill(null)
  }

  const columns: Column<SaleRow>[] = useMemo(() => {
    const rowsRef = drilled ? drilled.sales : sales
    return [
      { key: 'n', header: '#', render: (s) => String(rowsRef.indexOf(s) + 1) },
      { key: 'code', header: 'Código', render: (s) => <span className="font-medium text-text">{s.code}</span> },
      { key: 'sede', header: 'Sede', render: (s) => s.sede?.name ?? s.sede?.code ?? '—' },
      { key: 'asesor', header: 'Asesor', render: (s) => s.advisor?.name ?? '—' },
      { key: 'sup', header: 'Supervisor', render: (s) => s.managerAdvisor?.name ?? '—' },
      { key: 'cliente', header: 'Cliente', render: (s) => s.client?.titular_name ?? '—' },
      { key: 'doc', header: 'Documento', render: (s) => s.client?.document_number ?? '—' },
      { key: 'campaign', header: 'Campaña', render: (s) => s.campaign?.name ?? '—' },
      { key: 'fecha', header: 'Fecha', render: (s) => new Date(s.sale_date).toLocaleDateString() },
      {
        key: 'estado',
        header: 'Estado',
        render: (s) => (
          <Badge tone="agendado">
            {SALE_STATUS_LABELS[s.reason as keyof typeof SALE_STATUS_LABELS] ?? s.reason}
            {s.sub_reason ? ` · ${subStatusLabel(s.sub_reason)}` : ''}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (s) =>
          canEdit ? (
            <span onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" onClick={() => setStatusSale(s)}>Estado</Button>
            </span>
          ) : null,
      },
    ]
  }, [drilled, sales, canEdit])

  return (
    <div>
      <PageHeader
        title="Ventas"
        description="Míralas por sede, campaña o sala. Haz clic en una fila para editar la venta."
        actions={
          canRegister ? (
            <Button onClick={() => router.push('/dashboard/ventas/nueva')}>Nueva venta</Button>
          ) : undefined
        }
      />

      {/* Selector de vista */}
      <div className="mb-4 inline-flex rounded-xl border border-border bg-surface p-1">
        {VIEW_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => changeView(t.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === t.value ? 'bg-brand-red text-white shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        {isSupervisor && (
          <div className="w-52">
            <Select
              label="Ámbito"
              value={scope}
              onChange={setScope}
              options={[
                { value: 'sede', label: 'Toda la sede' },
                { value: 'grupo', label: 'Mi grupo' },
                { value: 'propias', label: 'Mis ventas' },
              ]}
            />
          </div>
        )}
        <div className="w-52">
          <Select label="Estado" value={reason} onChange={setReason} placeholder="Todos" options={SALE_STATUS_OPTIONS} />
        </div>
        <DatePicker label="Desde" value={desde} onChange={setDesde} />
        <DatePicker label="Hasta" value={hasta} onChange={setHasta} />
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {view === 'table' ? (
        <Table
          columns={columns}
          rows={sales}
          getRowKey={(s) => s.id_sale}
          loading={loading}
          onRowClick={canEdit ? setEditSale : undefined}
          emptyMessage="No hay ventas."
        />
      ) : drilled ? (
        <div>
          <div className="mb-3">
            <Button variant="secondary" onClick={() => setDrill(null)}>
              ← Volver a {view === 'sede' ? 'sedes' : view === 'sala' ? 'salas' : 'campañas'}
            </Button>
          </div>
          <h2 className="mb-3 text-lg font-semibold text-text">
            {drilled.title} <span className="text-sm font-normal text-text-muted">· {drilled.sales.length} venta(s)</span>
          </h2>
          <Table
            columns={columns}
            rows={drilled.sales}
            getRowKey={(s) => s.id_sale}
            onRowClick={canEdit ? setEditSale : undefined}
            emptyMessage="Sin ventas."
          />
        </div>
      ) : (
        <SalesGroupGrid groups={groups} variant={view as GroupVariant} onOpen={(g) => setDrill(g.key)} />
      )}

      {statusSale && <SaleStatusModal sale={statusSale} onClose={() => setStatusSale(null)} onSaved={load} />}
      {editSale && <SaleGlassEditModal sale={editSale} onClose={() => setEditSale(null)} onSaved={load} />}
    </div>
  )
}
