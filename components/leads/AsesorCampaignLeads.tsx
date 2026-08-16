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
import type { Campaign, Lead, Me } from '@/lib/types'
import { LeadDetailModal } from './LeadDetailModal'
import { WhatsAppButton } from './WhatsAppButton'

export function AsesorCampaignLeads({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [tab, setTab] = useState('pendientes')
  const [detail, setDetail] = useState<Lead | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [availableCount, setAvailableCount] = useState(0)
  const [notice, setNotice] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')

  function load(t = tab) {
    apiGet<Lead[]>(`/api/leads?campaignId=${campaignId}&view=${t}`)
      .then((data) => {
        setLeads(data)
        if (t === 'pendientes') setPendingCount(data.filter((l) => l.status === 'SIN_GESTION').length)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(() => load(tab), [campaignId, tab])

  // Cuenta de pendientes (para habilitar/deshabilitar "Asignarme").
  function refreshPending() {
    apiGet<Lead[]>(`/api/leads?campaignId=${campaignId}&view=pendientes`)
      .then((l) => setPendingCount(l.filter((x) => x.status === 'SIN_GESTION').length))
      .catch(() => {})
  }

  // Cantidad de leads sin atender (pool disponible) para el label.
  function refreshAvailable() {
    apiGet<{ count: number }>(`/api/leads/available?campaignId=${campaignId}`)
      .then((r) => setAvailableCount(r.count))
      .catch(() => {})
  }
  useEffect(refreshAvailable, [campaignId])

  useEffect(() => {
    apiGet<Campaign[]>('/api/campaigns')
      .then((cs) => setCampaign(cs.find((c) => c.campaign_id === campaignId) ?? null))
      .catch(() => {})
  }, [campaignId])

  useEffect(() => {
    apiGet<Me>('/api/auth/me').then(setMe).catch(() => {})
  }, [])

  // Nombre del asesor para el saludo de WhatsApp (nombre + primer apellido).
  const asesorName = me ? `${me.name} ${me.first_last_name}`.trim() : ''
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
      refreshAvailable()
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
    {
      key: 'wa',
      header: 'WhatsApp',
      render: (l) => <WhatsAppButton leadNumber={l.client_number} asesorName={asesorName} />,
    },
  ]

  return (
    <div>
      <LinkButton href="/dashboard/campaigns" variant="ghost">← Campañas</LinkButton>
      <div className="mt-2">
        <PageHeader
          title={campaignName}
          description={isAuto ? 'Modo automático: toma el siguiente lead con "Asignarme".' : 'Tus leads en esta campaña.'}
          actions={
            isAuto ? (
              <div className="flex items-center gap-3">
                {pendingCount === 0 && availableCount > 0 && (
                  <span className="animate-pulse rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-300">
                    HAY {availableCount} TOTALES SIN ATENDER →
                  </span>
                )}
                <Button onClick={selfAssign} loading={assigning} disabled={pendingCount > 0}>
                  Asignarme un lead
                </Button>
              </div>
            ) : undefined
          }
        />
      </div>
      {isAuto && pendingCount > 0 && (
        <p className="mb-3 text-sm text-text-muted">Termina tu lead pendiente antes de tomar otro.</p>
      )}
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
          onSaved={() => { load(tab); refreshPending(); refreshAvailable() }}
          onRegisterVenta={() => router.push(`/dashboard/mis-ventas?leadId=${detail.id}&campaignId=${detail.campaignId}`)}
        />
      )}
    </div>
  )
}
