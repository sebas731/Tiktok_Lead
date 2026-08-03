'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge, leadStatusTone } from '@/components/ui/Badge'
import { apiGet } from '@/lib/api/client'
import { STATUS_LABELS } from '@/lib/constants/leads'
import type { Lead, Role } from '@/lib/types'
import { AssignLeadsModal } from './AssignLeadsModal'

export function CampaignLeadsView({ campaignId, role }: { campaignId: string; role: Role }) {
  const canAssign = role === 'ADMIN' || role === 'SUPERVISOR'
  const [leads, setLeads] = useState<Lead[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [assignOpen, setAssignOpen] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setSelected(new Set())
    apiGet<Lead[]>(`/api/leads?campaignId=${campaignId}`)
      .then(setLeads)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [campaignId])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const columns: Column<Lead>[] = [
    ...(canAssign
      ? [{
          key: 'sel',
          header: '',
          render: (l: Lead) => (
            <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
          ),
        }]
      : []),
    { key: 'phone', header: 'Teléfono', render: (l) => l.client_number },
    {
      key: 'status',
      header: 'Estado',
      render: (l) => <Badge tone={leadStatusTone(l.status)}>{STATUS_LABELS[l.status] ?? l.status}</Badge>,
    },
    { key: 'asesor', header: 'Asesor', render: (l) => l.asignadoA?.name ?? '—' },
  ]

  return (
    <div className="space-y-6">
      <Link href="/dashboard/campaigns" className="text-sm text-gray-500 hover:text-gray-800">← Campañas</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Leads de la campaña</h1>
        {canAssign && (
          <Button onClick={() => setAssignOpen(true)} disabled={selected.size === 0}>
            Asignar seleccionados ({selected.size})
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Table columns={columns} rows={leads} getRowKey={(l) => l.id} emptyMessage="No hay leads." />
      {assignOpen && (
        <AssignLeadsModal
          open
          onClose={() => setAssignOpen(false)}
          onAssigned={load}
          campaignId={campaignId}
          leadIds={[...selected]}
        />
      )}
    </div>
  )
}
