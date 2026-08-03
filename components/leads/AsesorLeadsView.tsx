'use client'

import { useEffect, useState } from 'react'
import { Table, type Column } from '@/components/ui/Table'
import { Badge, leadStatusTone } from '@/components/ui/Badge'
import { apiGet } from '@/lib/api/client'
import { STATUS_LABELS, SUBSTATUS_LABELS } from '@/lib/constants/leads'
import type { Lead } from '@/lib/types'
import { LeadDetailModal } from './LeadDetailModal'

const FINALES = ['POSITIVO', 'NEGATIVO']

export function AsesorLeadsView() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [active, setActive] = useState<Lead | null>(null)
  const [error, setError] = useState('')

  function load() {
    apiGet<Lead[]>('/api/leads')
      .then((all) => setLeads(all.filter((l) => !FINALES.includes(l.status))))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [])

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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Mis leads</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Table
        columns={columns}
        rows={leads}
        getRowKey={(l) => l.id}
        onRowClick={setActive}
        emptyMessage="No tienes leads pendientes."
      />
      {active && (
        <LeadDetailModal
          lead={active}
          onClose={() => setActive(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
