'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGet } from '@/lib/api/client'
import type { Campaign, Role } from '@/lib/types'
import { CampaignFormModal } from './CampaignFormModal'
import { AssignUsersModal } from './AssignUsersModal'

export function CampaignsView({ role }: { role: Role }) {
  const router = useRouter()
  const isAdmin = role === 'ADMIN'
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState<{ open: boolean; campaign?: Campaign | null }>({ open: false })
  const [assignId, setAssignId] = useState<string | null>(null)

  function load() {
    apiGet<Campaign[]>('/api/campaigns')
      .then(setCampaigns)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [])

  const columns: Column<Campaign>[] = [
    { key: 'name', header: 'Campaña', render: (c) => c.name },
    { key: 'leads', header: 'Leads', render: (c) => c._count?.lead ?? 0 },
    {
      key: 'status',
      header: 'Estado',
      render: (c) => <Badge tone={c.status ? 'green' : 'gray'}>{c.status ? 'Activa' : 'Inactiva'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (c) =>
        isAdmin ? (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" onClick={() => setForm({ open: true, campaign: c })}>Editar</Button>
            <Button variant="secondary" onClick={() => setAssignId(c.campaign_id)}>Asignar</Button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Campañas</h1>
        {isAdmin && <Button onClick={() => setForm({ open: true, campaign: null })}>Nueva campaña</Button>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Table
        columns={columns}
        rows={campaigns}
        getRowKey={(c) => c.campaign_id}
        onRowClick={(c) => router.push(`/dashboard/campaigns/${c.campaign_id}/leads`)}
        emptyMessage="No hay campañas."
      />
      <CampaignFormModal
        open={form.open}
        campaign={form.campaign}
        onClose={() => setForm({ open: false })}
        onSaved={load}
      />
      {assignId && (
        <AssignUsersModal open onClose={() => setAssignId(null)} campaignId={assignId} />
      )}
    </div>
  )
}
