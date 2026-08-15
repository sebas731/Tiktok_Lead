'use client'

import { useEffect, useState } from 'react'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet } from '@/lib/api/client'
import { fullName, type Me } from '@/lib/types'
import { UserFormModal } from './UserFormModal'
import { UserDetailModal } from './UserDetailModal'

export function UsersView() {
  const [users, setUsers] = useState<Me[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [error, setError] = useState('')

  function load() {
    apiGet<Me[]>('/api/users')
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [])

  const columns: Column<Me>[] = [
    { key: 'name', header: 'Nombre', render: (u) => fullName(u) },
    { key: 'login', header: 'Usuario', render: (u) => u.login },
    { key: 'role', header: 'Rol', render: (u) => u.rol.name },
    {
      key: 'status',
      header: 'Estado',
      render: (u) => <Badge tone={u.status ? 'positivo' : 'neutral'}>{u.status ? 'Activo' : 'Inactivo'}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Haz clic en un usuario para ver su detalle."
        actions={<Button onClick={() => setCreateOpen(true)}>Nuevo usuario</Button>}
      />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Table
        columns={columns}
        rows={users}
        getRowKey={(u) => u.user_id}
        onRowClick={(u) => setDetailId(u.user_id)}
        emptyMessage="No hay usuarios."
      />
      {createOpen && <UserFormModal open user={null} onClose={() => setCreateOpen(false)} onSaved={load} />}
      {detailId && (
        <UserDetailModal userId={detailId} onClose={() => setDetailId(null)} onChanged={load} />
      )}
    </div>
  )
}
