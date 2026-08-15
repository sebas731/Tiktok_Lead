'use client'

import { useEffect, useState } from 'react'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet } from '@/lib/api/client'
import type { Sede } from '@/lib/types'
import { SedeFormModal } from './SedeFormModal'
import { SedeAccessModal } from './SedeAccessModal'

export function SedesView() {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [form, setForm] = useState<{ open: boolean; sede?: Sede | null }>({ open: false })
  const [accessId, setAccessId] = useState<string | null>(null)
  const [error, setError] = useState('')

  function load() {
    apiGet<Sede[]>('/api/sedes')
      .then(setSedes)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [])

  const columns: Column<Sede>[] = [
    { key: 'code', header: 'Código', render: (s) => s.code },
    { key: 'name', header: 'Nombre', render: (s) => s.name },
    { key: 'ventas', header: 'Ventas', render: (s) => s._count?.sales ?? 0 },
    { key: 'address', header: 'Dirección', render: (s) => s.address ?? '—' },
    {
      key: 'status',
      header: 'Estado',
      render: (s) => <Badge tone={s.status ? 'positivo' : 'neutral'}>{s.status ? 'Activa' : 'Inactiva'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => setForm({ open: true, sede: s })}>Editar</Button>
          <Button variant="ghost" onClick={() => setAccessId(s.sede_id)}>Accesos</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sedes"
        actions={<Button onClick={() => setForm({ open: true, sede: null })}>Nueva sede</Button>}
      />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Table columns={columns} rows={sedes} getRowKey={(s) => s.sede_id} emptyMessage="No hay sedes." />
      {form.open && (
        <SedeFormModal key={form.sede?.sede_id ?? 'new'} open sede={form.sede} onClose={() => setForm({ open: false })} onSaved={load} />
      )}
      {accessId && <SedeAccessModal sedeId={accessId} onClose={() => setAccessId(null)} />}
    </div>
  )
}
