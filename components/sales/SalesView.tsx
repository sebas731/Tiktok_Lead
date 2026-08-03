'use client'

import { useEffect, useState } from 'react'
import { Table, type Column } from '@/components/ui/Table'
import { apiGet } from '@/lib/api/client'
import type { Lead } from '@/lib/types'
import { SaleEditModal } from './SaleEditModal'

export function SalesView() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [active, setActive] = useState<Lead | null>(null)
  const [error, setError] = useState('')

  function load() {
    apiGet<Lead[]>('/api/leads?status=POSITIVO')
      .then(setLeads)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [])

  const columns: Column<Lead>[] = [
    { key: 'phone', header: 'Teléfono', render: (l) => l.client_number },
    { key: 'titular', header: 'Cliente', render: (l) => l.name_client ?? '—' },
    { key: 'sale', header: 'Detalle', render: (l) => (l.saleDetail ? 'Registrado' : 'Pendiente') },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Ventas por revisar</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Table
        columns={columns}
        rows={leads}
        getRowKey={(l) => l.id}
        onRowClick={(l) => l.saleDetail && setActive(l)}
        emptyMessage="No hay ventas por revisar."
      />
      {active && (
        <SaleEditModal lead={active} onClose={() => setActive(null)} onSaved={load} />
      )}
    </div>
  )
}
