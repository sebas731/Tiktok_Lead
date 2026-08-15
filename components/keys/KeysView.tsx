'use client'

import { useEffect, useState } from 'react'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet, apiSend } from '@/lib/api/client'
import type { KeyRow } from '@/lib/types'
import { KeyFormModal } from './KeyFormModal'

const DAY = 24 * 60 * 60 * 1000

/** Indicador visual de la expiración de la Key. */
function ExpiryCell({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <span className="text-text-muted">Sin expiración</span>
  const date = new Date(expiresAt)
  const days = Math.floor((date.getTime() - Date.now()) / DAY)
  const label = date.toLocaleDateString()
  if (days < 0) {
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Vencida · {label}</span>
  }
  if (days <= 7) {
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Vence pronto · {label}</span>
  }
  return <span className="text-text">{label}</span>
}

export function KeysView() {
  const [keys, setKeys] = useState<KeyRow[]>([])
  const [form, setForm] = useState<{ open: boolean; keyRow?: KeyRow | null }>({ open: false })
  const [error, setError] = useState('')

  function load() {
    apiGet<KeyRow[]>('/api/keys')
      .then(setKeys)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [])

  async function remove(k: KeyRow) {
    if (!window.confirm(`¿Eliminar la Key "${k.name}"?`)) return
    try {
      await apiSend(`/api/keys/${k.id}`, 'DELETE')
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  const columns: Column<KeyRow>[] = [
    { key: 'name', header: 'Nombre', render: (k) => <span className="font-medium text-text">{k.name}</span> },
    { key: 'adv', header: 'Advertiser ID', render: (k) => <span className="font-mono text-xs">{k.advertiserId}</span> },
    { key: 'token', header: 'Token', render: (k) => <span className="font-mono text-xs text-text-muted">{k.tokenMasked}</span> },
    { key: 'exp', header: 'Expiración', render: (k) => <ExpiryCell expiresAt={k.expiresAt} /> },
    {
      key: 'status',
      header: 'Estado',
      render: (k) => <Badge tone={k.status ? 'positivo' : 'neutral'}>{k.status ? 'Activa' : 'Inactiva'}</Badge>,
    },
    { key: 'camps', header: 'Campañas', render: (k) => k.campaignCount },
    {
      key: 'actions',
      header: '',
      render: (k) => (
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => setForm({ open: true, keyRow: k })}>Editar</Button>
          <Button variant="ghost" onClick={() => remove(k)}>Eliminar</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Keys"
        description="Tokens de acceso a la API de TikTok. Cada campaña TikTok usa una Key."
        actions={<Button onClick={() => setForm({ open: true, keyRow: null })}>Nueva Key</Button>}
      />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Table columns={columns} rows={keys} getRowKey={(k) => k.id} emptyMessage="No hay Keys registradas." />
      {form.open && (
        <KeyFormModal key={form.keyRow?.id ?? 'new'} open keyRow={form.keyRow} onClose={() => setForm({ open: false })} onSaved={load} />
      )}
    </div>
  )
}
