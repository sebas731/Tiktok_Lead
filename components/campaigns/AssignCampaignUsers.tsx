'use client'

import { useCallback, useEffect, useState } from 'react'
import { LinkButton } from '@/components/ui/LinkButton'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet, apiSend } from '@/lib/api/client'
import type { Me } from '@/lib/types'

type Assignment = { user: { user_id: string } }

const ROLE_TONE: Record<string, 'agendado' | 'positivo' | 'singestion' | 'neutral'> = {
  SUPERVISOR: 'agendado',
  BACK: 'positivo',
  ASESOR: 'singestion',
}

export function AssignCampaignUsers({ campaignId }: { campaignId: string }) {
  const [users, setUsers] = useState<Me[]>([])
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const loadAssigned = useCallback(() => {
    apiGet<Assignment[]>(`/api/campaigns/${campaignId}/assign-users`)
      .then((a) => setAssigned(new Set(a.map((x) => x.user.user_id))))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [campaignId])

  const loadUsers = useCallback(() => {
    const q = search ? `?search=${encodeURIComponent(search)}` : ''
    apiGet<Me[]>(`/api/users${q}`)
      .then((u) => setUsers(u.filter((x) => x.rol.name !== 'ADMIN')))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [search])

  useEffect(() => { loadAssigned() }, [loadAssigned])
  useEffect(() => { loadUsers() }, [loadUsers])

  async function toggle(u: Me) {
    setBusy(u.user_id)
    setError('')
    try {
      if (assigned.has(u.user_id)) {
        await apiSend(`/api/campaigns/${campaignId}/assign-users/${u.user_id}`, 'DELETE')
      } else {
        await apiSend(`/api/campaigns/${campaignId}/assign-users`, 'POST', { userId: u.user_id })
      }
      loadAssigned()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy('')
    }
  }

  const columns: Column<Me>[] = [
    { key: 'name', header: 'Nombre', render: (u) => `${u.name} ${u.first_last_name}` },
    { key: 'dni', header: 'DNI', render: (u) => u.document_number },
    { key: 'rol', header: 'Rol', render: (u) => <Badge tone={ROLE_TONE[u.rol.name] ?? 'neutral'}>{u.rol.name}</Badge> },
    {
      key: 'estado',
      header: '',
      render: (u) =>
        assigned.has(u.user_id) ? (
          <Button variant="danger" loading={busy === u.user_id} onClick={() => toggle(u)}>Quitar</Button>
        ) : (
          <Button loading={busy === u.user_id} onClick={() => toggle(u)}>Asignar</Button>
        ),
    },
  ]

  return (
    <div>
      <LinkButton href="/dashboard/campaigns" variant="ghost">← Campañas</LinkButton>
      <div className="mt-2">
        <PageHeader title="Asignar usuarios a la campaña" description="Supervisores, back y asesores. Cada uno tendrá los permisos de su rol dentro de la campaña." />
      </div>
      <div className="mb-4 max-w-md">
        <Input label="Buscar por nombre o DNI" value={search} onChange={setSearch} placeholder="Escribe para filtrar…" />
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Table columns={columns} rows={users} getRowKey={(u) => u.user_id} emptyMessage="No hay usuarios." />
    </div>
  )
}
