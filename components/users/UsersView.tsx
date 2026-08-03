'use client'

import { useEffect, useState } from 'react'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGet } from '@/lib/api/client'
import type { Me } from '@/lib/types'
import { UserFormModal } from './UserFormModal'

export function UsersView() {
  const [users, setUsers] = useState<Me[]>([])
  const [form, setForm] = useState<{ open: boolean; user?: Me | null }>({ open: false })
  const [error, setError] = useState('')

  function load() {
    apiGet<Me[]>('/api/users')
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [])

  const columns: Column<Me>[] = [
    { key: 'name', header: 'Nombre', render: (u) => u.name },
    { key: 'login', header: 'Usuario', render: (u) => u.login },
    { key: 'role', header: 'Rol', render: (u) => u.rol.name },
    {
      key: 'status',
      header: 'Estado',
      render: (u) => <Badge tone={u.status ? 'green' : 'gray'}>{u.status ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" onClick={() => setForm({ open: true, user: u })}>Editar</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
        <Button onClick={() => setForm({ open: true, user: null })}>Nuevo usuario</Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Table columns={columns} rows={users} getRowKey={(u) => u.user_id} emptyMessage="No hay usuarios." />
      <UserFormModal
        open={form.open}
        user={form.user}
        onClose={() => setForm({ open: false })}
        onSaved={load}
      />
    </div>
  )
}
