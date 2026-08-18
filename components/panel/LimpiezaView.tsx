'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { apiGet, apiSend } from '@/lib/api/client'
import type { Campaign } from '@/lib/types'
import type { Breakdown } from '@/components/campaigns/CampaignStats'

type Row = { campaignId: string; name: string; sinGestion: number }

export function LimpiezaView() {
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      apiGet<Campaign[]>('/api/campaigns'),
      apiGet<Record<string, Breakdown>>('/api/leads/stats'),
    ])
      .then(([camps, stats]) => {
        setRows(camps.map((c) => ({ campaignId: c.campaign_id, name: c.name, sinGestion: stats[c.campaign_id]?.sinGestion ?? 0 })))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  async function eliminar(r: Row) {
    if (r.sinGestion === 0) return
    if (!window.confirm(`¿Eliminar los ${r.sinGestion} leads SIN GESTIÓN de "${r.name}"? Esta acción no se puede deshacer.`)) return
    setBusy(r.campaignId)
    setError('')
    setNotice('')
    try {
      const res = await apiSend<{ deleted: number }>('/api/leads/delete-sin-gestion', 'POST', { campaignId: r.campaignId })
      setNotice(`Se eliminaron ${res.deleted} leads sin gestión de "${r.name}".`)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    } finally {
      setBusy('')
    }
  }

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Campaña', render: (r) => <span className="font-medium text-text">{r.name}</span> },
    { key: 'sg', header: 'Sin gestión', render: (r) => <span className="font-semibold text-text">{r.sinGestion}</span> },
    {
      key: 'del',
      header: '',
      render: (r) => (
        <Button variant="danger" onClick={() => eliminar(r)} loading={busy === r.campaignId} disabled={r.sinGestion === 0}>
          Eliminar sin gestión
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Limpieza de leads" description="Eliminar leads SIN GESTIÓN por campaña. Solo administrador. Irreversible." />
      {notice && <p className="mb-4 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Table columns={columns} rows={rows} getRowKey={(r) => r.campaignId} loading={loading} emptyMessage="Sin campañas." />
    </div>
  )
}
