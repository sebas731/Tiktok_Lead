'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiSend } from '@/lib/api/client'
import type { Me } from '@/lib/types'

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'ASESOR', label: 'Asesor' },
  { value: 'BACK', label: 'Back' },
]

const TEXT_FIELDS = [
  { name: 'name', label: 'Nombre' },
  { name: 'first_last_name', label: 'Apellido paterno' },
  { name: 'second_last_name', label: 'Apellido materno' },
  { name: 'email', label: 'Email' },
]

type Props = { open: boolean; onClose: () => void; onSaved: () => void; user?: Me | null }

export function UserFormModal({ open, onClose, onSaved, user }: Props) {
  const isEdit = Boolean(user)
  const [form, setForm] = useState<Record<string, string>>({
    name: user?.name ?? '',
    first_last_name: user?.first_last_name ?? '',
    second_last_name: user?.second_last_name ?? '',
    email: user?.email ?? '',
    login: '',
    password: '',
    document_number: '',
  })
  const [roleName, setRoleName] = useState(user?.rol.name ?? 'ASESOR')
  const [active, setActive] = useState(user?.status ?? true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function save() {
    setLoading(true)
    setError('')
    try {
      if (isEdit && user) {
        await apiSend(`/api/users/${user.user_id}`, 'PATCH', {
          name: form.name,
          email: form.email,
          first_last_name: form.first_last_name,
          second_last_name: form.second_last_name,
          roleName,
          status: active,
          ...(form.password ? { password: form.password } : {}),
        })
      } else {
        await apiSend('/api/users', 'POST', { ...form, roleName })
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading}>Guardar</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEXT_FIELDS.map((f) => (
          <Input key={f.name} label={f.label} value={form[f.name] ?? ''} onChange={set(f.name)} />
        ))}
        {!isEdit && (
          <>
            <Input label="Usuario (login)" value={form.login} onChange={set('login')} />
            <Input label="N° documento" value={form.document_number} onChange={set('document_number')} />
          </>
        )}
        <Input
          label={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          type="password"
          value={form.password}
          onChange={set('password')}
        />
        <Select label="Rol" value={roleName} onChange={setRoleName} options={ROLE_OPTIONS} />
        {isEdit && (
          <Select
            label="Estado"
            value={active ? 'true' : 'false'}
            onChange={(v) => setActive(v === 'true')}
            options={[
              { value: 'true', label: 'Activo' },
              { value: 'false', label: 'Inactivo' },
            ]}
          />
        )}
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
