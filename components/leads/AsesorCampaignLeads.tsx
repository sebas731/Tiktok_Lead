'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LinkButton } from '@/components/ui/LinkButton'
import { Button } from '@/components/ui/Button'
import { Table, type Column } from '@/components/ui/Table'
import { Badge, leadStatusTone } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet, apiSend } from '@/lib/api/client'
import { STATUS_LABELS, SUBSTATUS_LABELS } from '@/lib/constants/leads'
import type { Campaign, Lead } from '@/lib/types'
import { LeadDetailModal } from './LeadDetailModal'

export function AsesorCampaignLeads({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [tab, setTab] = useState('pendientes')
  const [detail, setDetail] = useState<Lead | null>(null)
  const [notice, setNotice] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')

  function load(t = tab) {
    // El servidor filtra: 'pendientes' = asignados no finales; 'historial' =
    // los que atendió y no fueron reasignados a otro asesor.
    apiGet<Lead[]>(`/api/leads?campaignId=${campaignId}&view=${t}`)
      .then(setLeads)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(() => load(tab), [campaignId, tab])

  // Modo de la campaña (para mostrar el botón "Asignarme" en modo AUTO).
  useEffect(() => {
    apiGet<Campaign[]>('/api/campaigns')
      .then((cs) => setCampaign(cs.find((c) => c.campaign_id === campaignId) ?? null))
      .catch(() => {})
  }, [campaignId])

  const isAuto = campaign?.leadMode === 'AUTO'
  const campaignName = campaign?.name ?? leads[0]?.campaign?.name ?? 'la campaña'

  async function selfAssign() {
    setAssigning(true)
    setNotice('')
    setError('')
    try {
      const lead = await apiSend<Lead>('/api/leads/self-assign', 'POST', { campaignId })
      setNotice(`Se te asignó el lead ${lead.client_number}.`)
      setTab('pendientes')
      load('pendientes')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No hay leads disponibles')
    } finally {
      setAssigning(false)
    }
  }

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
        <PageHeader
          title={campaignName}
          description={isAuto ? 'Modo automático: usa "Asignarme" para tomar el siguiente lead.' : 'Tus leads en esta campaña.'}
          actions={
            isAuto ? (
              <Button onClick={selfAssign} loading={assigning}>Asignarme un lead</Button>
            ) : undefined
          }
        />
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
      {notice && <p className="mb-4 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Table
        columns={columns}
        rows={leads}
        getRowKey={(l) => l.id}
        onRowClick={setDetail}
        emptyMessage={isAuto && tab === 'pendientes' ? 'Sin leads. Pulsa "Asignarme un lead".' : 'Sin leads en esta vista.'}
      />
      {detail && (
        <LeadDetailModal
          lead={detail}
          onClose={() => setDetail(null)}
          onSaved={() => load(tab)}
          onRegisterVenta={() => router.push(`/dashboard/mis-ventas?leadId=${detail.id}&campaignId=${detail.campaignId}`)}
        />
      )}
    </div>
  )
}
