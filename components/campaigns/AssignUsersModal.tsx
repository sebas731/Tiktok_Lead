'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { apiGet, apiSend } from '@/lib/api/client'
import type { Me } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  campaignId: string
}

export function AssignUsersModal({ open, onClose, campaignId }: Props) {
  const [users, setUsers] = useState<Me[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    apiGet<Me[]>('/api/users')
      .then((all) => setUsers(all.filter((u) => ['SUPERVISOR', 'BACK'].includes(u.rol.name))))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [open])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function save() {
    setLoading(true)
    setError('')
    try {
      await apiSend(`/api/campaigns/${campaignId}/assign`, 'POST', { userIds: [...selected] })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al asignar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Asignar usuarios a la campaña"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading} disabled={selected.size === 0}>Asignar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500">Solo usuarios SUPERVISOR o BACK.</p>
        {users.map((u) => (
          <label key={u.user_id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <input type="checkbox" checked={selected.has(u.user_id)} onChange={() => toggle(u.user_id)} />
            <span className="text-sm text-gray-800">{u.name}</span>
            <span className="text-xs text-gray-400">{u.rol.name}</span>
          </label>
        ))}
        {users.length === 0 && <p className="text-sm text-gray-400">No hay usuarios asignables.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
