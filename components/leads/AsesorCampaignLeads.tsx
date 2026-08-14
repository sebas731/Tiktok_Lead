'use client'

import { useEffect, useState } from 'react'
import { LinkButton } from '@/components/ui/LinkButton'
import { useRouter } from 'next/navigation'
import { Table, type Column } from '@/components/ui/Table'
import { Badge, leadStatusTone } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet } from '@/lib/api/client'
import { STATUS_LABELS, SUBSTATUS_LABELS } from '@/lib/constants/leads'
import type { Lead } from '@/lib/types'
import { LeadDetailModal } from './LeadDetailModal'

export function AsesorCampaignLeads({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [tab, setTab] = useState('pendientes')
  const [detail, setDetail] = useState<Lead | null>(null)
  const [error, setError] = useState('')

  function load() {
    // El servidor filtra: 'pendientes' = asignados no finales; 'historial' =
    // los que atendió y no fueron reasignados a otro asesor.
    apiGet<Lead[]>(`/api/leads?campaignId=${campaignId}&view=${tab}`)
      .then(setLeads)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [campaignId, tab])

  const rows = leads
  const campaignName = leads[0]?.campaign?.name ?? 'la campaña'

  const columns: Column<Lead>[] = [
    {
      key: 'phone',
      header: 'Lead',
      render: (l) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">{l.client_number}</span>
          <Badge tone="singestion">{l.campaign?.name ?? '—'}</Badge>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (l) => <Badge tone={leadStatusTone(l.status)}>{STATUS_LABELS[l.status] ?? l.status}</Badge>,
    },
    { key: 'sub', header: 'Sub-estado', render: (l) => SUBSTATUS_LABELS[l.sub_status] ?? l.sub_status },
  ]

  return (
    <div>
      <LinkButton href="/dashboard/campaigns" variant="ghost">← Campañas</LinkButton>
      <div className="mt-2">
        <PageHeader title={campaignName} description="Tus leads en esta campaña." />
      </div>
      <div className="mb-4">
        <Tabs
          tabs={[
            { id: 'pendientes', label: 'Por atender' },
            { id: 'historial', label: 'Historial' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Table columns={columns} rows={rows} getRowKey={(l) => l.id} onRowClick={setDetail} emptyMessage="Sin leads en esta vista." />
      {detail && (
        <LeadDetailModal
          lead={detail}
          onClose={() => setDetail(null)}
          onSaved={load}
          onRegisterVenta={() => router.push(`/dashboard/mis-ventas?leadId=${detail.id}&campaignId=${detail.campaignId}`)}
        />
      )}
    </div>
  )
}
