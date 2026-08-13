'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, type Column } from '@/components/ui/Table'
import { Badge, leadStatusTone } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet } from '@/lib/api/client'
import { STATUS_LABELS, SUBSTATUS_LABELS } from '@/lib/constants/leads'
import type { Lead } from '@/lib/types'
import { LeadDetailModal } from './LeadDetailModal'

const FINALES = ['POSITIVO', 'NEGATIVO']

export function AsesorLeadsView() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [tab, setTab] = useState('activos')
  const [detail, setDetail] = useState<Lead | null>(null)
  const [error, setError] = useState('')

  function load() {
    apiGet<Lead[]>('/api/leads')
      .then(setLeads)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [])

  const rows = leads.filter((l) =>
    tab === 'activos' ? !FINALES.includes(l.status) : FINALES.includes(l.status)
  )

  const columns: Column<Lead>[] = [
    { key: 'phone', header: 'Teléfono', render: (l) => l.client_number },
    {
      key: 'status',
      header: 'Estado',
      render: (l) => <Badge tone={leadStatusTone(l.status)}>{STATUS_LABELS[l.status] ?? l.status}</Badge>,
    },
    { key: 'sub', header: 'Sub-estado', render: (l) => SUBSTATUS_LABELS[l.sub_status] ?? l.sub_status },
  ]

  return (
    <div>
      <PageHeader title="Mis leads" />
      <div className="mb-4">
        <Tabs
          tabs={[
            { id: 'activos', label: 'Activos' },
            { id: 'historial', label: 'Historial' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Table
        columns={columns}
        rows={rows}
        getRowKey={(l) => l.id}
        onRowClick={setDetail}
        emptyMessage="Sin leads en esta vista."
      />
      {detail && (
        <LeadDetailModal
          lead={detail}
          onClose={() => setDetail(null)}
          onSaved={load}
          onRegisterVenta={() =>
            router.push(`/dashboard/mis-ventas?leadId=${detail.id}&campaignId=${detail.campaignId}`)
          }
        />
      )}
    </div>
  )
}
