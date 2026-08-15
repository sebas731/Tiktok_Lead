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

/** Link de WhatsApp a partir del número (Perú: antepone 51 a los de 9 dígitos). */
function waUrl(num: string): string {
  const d = num.replace(/\D/g, '')
  const full = d.length === 9 ? `51${d}` : d
  return `https://wa.me/${full}`
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M17.5 14.4c-.3-.15-1.7-.84-1.96-.94-.26-.1-.45-.15-.64.15-.19.29-.74.94-.9 1.13-.17.19-.33.21-.61.07-.3-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.73-1.63-2.02-.17-.29-.02-.45.13-.6.13-.13.29-.33.44-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.19 2.01 3.06 4.86 4.29.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.12.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34z" />
      <path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.15l-.3-.18-3 .94.95-2.92-.2-.31A8.2 8.2 0 1112 20.2z" />
    </svg>
  )
}

export function AsesorCampaignLeads({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaign, setCampaign] = useState<Campaign | null>(null)
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
      render: (l) => (
        <a
          href={waUrl(l.client_number)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Abrir en WhatsApp"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition hover:bg-emerald-50"
        >
          <WhatsAppIcon />
        </a>
      ),
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
