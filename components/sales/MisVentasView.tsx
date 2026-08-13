'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Table, type Column } from '@/components/ui/Table'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet } from '@/lib/api/client'
import { SALE_STATUS_LABELS, subStatusLabel } from '@/lib/constants/saleStatus'
import type { SaleRow } from '@/lib/types'
import { SaleForm } from './SaleForm'

export function MisVentasView() {
  const params = useSearchParams()
  const leadId = params.get('leadId') ?? undefined
  const campaignId = params.get('campaignId') ?? undefined
  const [tab, setTab] = useState(leadId ? 'nueva' : 'lista')
  const [sales, setSales] = useState<SaleRow[]>([])
  const [error, setError] = useState('')

  function load() {
    apiGet<SaleRow[]>('/api/sales')
      .then(setSales)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [])

  const columns: Column<SaleRow>[] = [
    { key: 'code', header: 'Código', render: (s) => s.code },
    { key: 'campaign', header: 'Campaña', render: (s) => s.campaign?.name ?? '—' },
    { key: 'cliente', header: 'Cliente', render: (s) => s.client?.titular_name ?? '—' },
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
  ]

  return (
    <div>
      <PageHeader title="Mis ventas" />
      <div className="mb-4">
        <Tabs
          tabs={[
            { id: 'nueva', label: 'Nueva venta' },
            { id: 'lista', label: 'Ver mis ventas' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      {tab === 'nueva' ? (
        <SaleForm
          leadId={leadId}
          campaignId={campaignId}
          onSaved={() => { load(); setTab('lista') }}
          onCancel={() => setTab('lista')}
        />
      ) : (
        <>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <Table columns={columns} rows={sales} getRowKey={(s) => s.id_sale} emptyMessage="No tienes ventas." />
        </>
      )}
    </div>
  )
}
