'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge, leadStatusTone } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet, apiSend } from '@/lib/api/client'
import { STATUS_LABELS, STATUS_OPTIONS } from '@/lib/constants/leads'
import type { Lead, Me, Role } from '@/lib/types'
import { AssignLeadsModal } from './AssignLeadsModal'

export function CampaignLeadsView({ campaignId, role }: { campaignId: string; role: Role }) {
  const canAssign = role === 'ADMIN' || role === 'SUPERVISOR'
  const isSupervisor = role === 'SUPERVISOR'
  const [leads, setLeads] = useState<Lead[]>([])
  const [meId, setMeId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [assign, setAssign] = useState<{ open: boolean; ids: string[] }>({ open: false, ids: [] })
  const [error, setError] = useState('')

  useEffect(() => {
    if (isSupervisor) apiGet<Me>('/api/auth/me').then((m) => setMeId(m.user_id)).catch(() => {})
  }, [isSupervisor])

  async function asignarme() {
    // El supervisor se asigna los leads seleccionados para atenderlos.
    await apiSend('/api/leads/assign', 'POST', { campaignId, asesorId: meId, leadIds: [...selected] })
    load()
  }

  // No se gestionan leads en estado final (POSITIVO / NEGATIVO).
  const statusOptions = STATUS_OPTIONS.filter((o) => o.value !== 'POSITIVO' && o.value !== 'NEGATIVO')

  function load() {
    setSelected(new Set())
    const p = new URLSearchParams({ campaignId, excludeFinal: '1' })
    if (statusFilter) p.set('status', statusFilter)
    apiGet<Lead[]>(`/api/leads?${p.toString()}`)
      .then(setLeads)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [campaignId, statusFilter])

  const sinAsignar = leads.filter((l) => !l.asignadoAId).length

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
    <div>
      <Link href="/dashboard/campaigns" className="text-sm text-text-muted hover:text-text">← Campañas</Link>
      <div className="mt-2">
        <PageHeader
          title="Leads de la campaña"
          description={`${sinAsignar} sin asignar de ${leads.length}`}
          actions={
            canAssign ? (
              <div className="flex flex-wrap gap-2">
                {isSupervisor && (
                  <Button variant="secondary" onClick={asignarme} disabled={selected.size === 0 || !meId}>
                    Asignármelos ({selected.size})
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setAssign({ open: true, ids: [...selected] })}
                  disabled={selected.size === 0}
                >
                  Asignar selección ({selected.size})
                </Button>
                <Button onClick={() => setAssign({ open: true, ids: [] })}>Asignar por cantidad</Button>
              </div>
            ) : undefined
          }
        />
      </div>
      <div className="mb-4 w-56">
        <Select
          label="Filtrar por estado"
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Todos"
          options={statusOptions}
        />
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Table columns={columns} rows={leads} getRowKey={(l) => l.id} emptyMessage="No hay leads." />
      {assign.open && (
        <AssignLeadsModal
          open
          onClose={() => setAssign({ open: false, ids: [] })}
          onAssigned={load}
          campaignId={campaignId}
          leadIds={assign.ids}
        />
      )}
    </div>
  )
}
