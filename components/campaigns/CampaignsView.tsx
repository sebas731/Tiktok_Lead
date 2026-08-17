'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet, apiSend } from '@/lib/api/client'
import type { Campaign, Role } from '@/lib/types'
import { CampaignFormModal } from './CampaignFormModal'
import { CampaignStats, type Breakdown } from './CampaignStats'

export function CampaignsView({ role }: { role: Role }) {
  const router = useRouter()
  const isAdmin = role === 'ADMIN'
  const isAsesor = role === 'ASESOR'
  const isSupervisor = role === 'SUPERVISOR'
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<Record<string, Breakdown>>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [syncing, setSyncing] = useState('')
  const [form, setForm] = useState<{ open: boolean; campaign?: Campaign | null }>({ open: false })

  function load() {
    apiGet<Campaign[]>('/api/campaigns')
      .then(setCampaigns)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [])

  // Desglose por estado (solo admin/supervisor): una sola consulta para todas.
  useEffect(() => {
    if (isAsesor) return
    apiGet<Record<string, Breakdown>>('/api/leads/stats').then(setStats).catch(() => {})
  }, [isAsesor])

  async function toggleStatus(c: Campaign) {
    await apiSend(`/api/campaigns/${c.campaign_id}`, 'PATCH', { status: !c.status })
    load()
  }
  async function remove(c: Campaign) {
    if (!window.confirm(`¿Eliminar la campaña "${c.name}" y todos sus leads? Esta acción no se puede deshacer.`)) return
    setNotice('')
    try {
      await apiSend(`/api/campaigns/${c.campaign_id}`, 'DELETE')
      load()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }
  async function sync(c: Campaign) {
    setSyncing(c.campaign_id)
    setNotice('')
    try {
      const r = await apiSend<{ created: number; existing: number; discarded: number }>(
        `/api/campaigns/${c.campaign_id}/sync`,
        'POST',
      )
      setNotice(`"${c.name}": ${r.created} nuevos · ${r.existing} existentes · ${r.discarded} descartados.`)
      load()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Error al sincronizar')
    } finally {
      setSyncing('')
    }
  }

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div>
      <PageHeader
        title="Campañas"
        description={isAsesor ? 'Entra a una campaña para gestionar tus leads.' : 'Haz clic en una campaña para ver sus leads.'}
        actions={isAdmin ? <Button onClick={() => setForm({ open: true, campaign: null })}>Nueva campaña</Button> : undefined}
      />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mb-4 text-sm text-text-muted">{notice}</p>}

      {campaigns.length === 0 ? (
        <EmptyState title="Sin campañas" description="Aún no hay campañas disponibles." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <button
              key={c.campaign_id}
              type="button"
              onClick={() => router.push(`/dashboard/campaigns/${c.campaign_id}/leads`)}
              className="flex flex-col rounded-2xl border border-border bg-surface p-5 text-left shadow-sm transition hover:border-brand-red/40 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="font-semibold text-text">{c.name}</p>
                <Badge tone={c.source === 'TIKTOK' ? 'agendado' : 'singestion'}>{c.source}</Badge>
              </div>
              {c.source === 'EXCEL' && c.lastSyncStatus === 'ERROR' && (
                <p className="mb-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700" title={c.lastSyncError ?? ''}>
                  ⚠ Falló la última sincronización
                </p>
              )}
              <div className="mt-auto flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold text-text">{c._count?.lead ?? 0}</p>
                  <p className="text-xs text-text-muted">{isAsesor ? 'por atender' : 'activos'}</p>
                </div>
                <Badge tone={c.status ? 'positivo' : 'neutral'}>{c.status ? 'Activa' : 'Inactiva'}</Badge>
              </div>
              {!isAsesor && <CampaignStats b={stats[c.campaign_id]} />}
              {isAdmin && (
                <div className="mt-4 flex flex-wrap gap-1 border-t border-border pt-3" onClick={stop}>
                  <Button variant="ghost" onClick={() => setForm({ open: true, campaign: c })}>Editar</Button>
                  <Button variant="ghost" onClick={() => router.push(`/dashboard/campaigns/${c.campaign_id}/assign`)}>Asignar</Button>
                  {c.source === 'EXCEL' && (
                    <Button variant="ghost" loading={syncing === c.campaign_id} onClick={() => sync(c)}>Sincronizar</Button>
                  )}
                  <Button variant="ghost" onClick={() => toggleStatus(c)}>{c.status ? 'Desactivar' : 'Activar'}</Button>
                  <Button variant="ghost" onClick={() => remove(c)}>Eliminar</Button>
                </div>
              )}
              {isSupervisor && (
                <div className="mt-4 flex flex-wrap gap-1 border-t border-border pt-3" onClick={stop}>
                  <Button variant="ghost" onClick={() => router.push(`/dashboard/campaigns/${c.campaign_id}/assign`)}>
                    Gestionar accesos
                  </Button>
                  {c.source === 'EXCEL' && (
                    <Button variant="ghost" loading={syncing === c.campaign_id} onClick={() => sync(c)}>Sincronizar</Button>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Se monta solo cuando está abierto para no arrastrar datos de otra campaña. */}
      {form.open && (
        <CampaignFormModal
          key={form.campaign?.campaign_id ?? 'new'}
          open
          campaign={form.campaign}
          onClose={() => setForm({ open: false })}
          onSaved={load}
        />
      )}
    </div>
  )
}
