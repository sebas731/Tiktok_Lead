'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { RecoverHelpModal } from './RecoverHelpModal'

// En el historial solo se pueden recuperar/corregir los N leads más recientes.
const RECOVERABLE = 5

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
  const [helpOpen, setHelpOpen] = useState(false)
  const [highlightId, setHighlightId] = useState('')
  const [error, setError] = useState('')

  // En historial solo son recuperables las primeras 5 filas (más recientes);
  // en "Por atender" todo lo asignado es editable.
  const recoverableIds = useMemo(
    () => new Set((tab === 'historial' ? leads.slice(0, RECOVERABLE) : leads).map((l) => l.id)),
    [leads, tab],
  )

  function openDetail(l: Lead) {
    if (tab === 'historial' && !recoverableIds.has(l.id)) {
      setNotice(`Solo puedes recuperar tus ${RECOVERABLE} leads más recientes.`)
      return
    }
    setNotice('')
    setDetail(l)
  }

  // Tras guardar: si fue una recuperación desde el historial, lo llevamos a "Por
  // atender" y resaltamos la fila en verde 3 s para que sea fácil de ubicar.
  function onLeadSaved(leadId: string) {
    const recovered = tab === 'historial'
    setDetail(null)
    if (recovered) {
      setTab('pendientes')
      load('pendientes')
      setHighlightId(leadId)
      setTimeout(() => setHighlightId(''), 3000)
    } else {
      load(tab)
    }
    refreshPending()
    refreshAvailable()
  }

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
    ...(tab === 'historial'
      ? [{
          key: 'recuperar',
          header: '',
          render: (l: Lead) =>
            recoverableIds.has(l.id) ? (
              <span className="text-xs font-medium text-brand-red">Recuperar</span>
            ) : (
              <span className="text-xs text-text-muted" title="Fuera de tus 5 más recientes">No disponible</span>
            ),
        }]
      : []),
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
      {tab === 'historial' && (
        <div className="mb-3 flex items-center gap-2 text-sm text-text-muted">
          <span>Puedes recuperar tus {RECOVERABLE} leads más recientes: haz clic en la fila para corregirlos.</span>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-xs font-bold text-text-muted transition hover:bg-bg hover:text-text"
            aria-label="Cómo recuperar un lead"
          >
            ?
          </button>
        </div>
      )}
      {notice && <p className="mb-4 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <style>{`
        @keyframes flash-green { 0%,70% { background-color: rgba(16,185,129,.18); } 100% { background-color: transparent; } }
        .flash-green { animation: flash-green 3s ease-out; }
      `}</style>
      <Table
        columns={columns}
        rows={leads}
        getRowKey={(l) => l.id}
        onRowClick={openDetail}
        rowClassName={(l) => (l.id === highlightId ? 'flash-green' : '')}
        emptyMessage={isAuto && tab === 'pendientes' ? 'Sin leads. Pulsa "Asignarme un lead".' : 'Sin leads en esta vista.'}
      />
      {detail && (
        <LeadDetailModal
          lead={detail}
          onClose={() => setDetail(null)}
          onSaved={() => onLeadSaved(detail.id)}
          onRegisterVenta={() => router.push(`/dashboard/mis-ventas?leadId=${detail.id}&campaignId=${detail.campaignId}`)}
        />
      )}
      {helpOpen && <RecoverHelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  )
}
