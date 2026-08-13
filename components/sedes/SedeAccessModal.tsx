'use client'

import { useCallback, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiGet, apiSend } from '@/lib/api/client'
import type { Me } from '@/lib/types'

type AccessRow = {
  userId: string
  expiresAt: string | null
  user: { user_id: string; name: string; rol: { name: string } }
}
type SedeDetail = { sede_id: string; name: string; access: AccessRow[] }

export function SedeAccessModal({ sedeId, onClose }: { sedeId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<SedeDetail | null>(null)
  const [users, setUsers] = useState<Me[]>([])
  const [userId, setUserId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(() => {
    Promise.all([apiGet<SedeDetail>(`/api/sedes/${sedeId}`), apiGet<Me[]>('/api/users')])
      .then(([d, u]) => {
        setDetail(d)
        setUsers(u)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [sedeId])
  useEffect(load, [load])

  async function grant() {
    if (!userId) return
    try {
      await apiSend(`/api/sedes/${sedeId}/access`, 'POST', {
        userId,
        ...(expiresAt ? { expiresAt } : {}),
      })
      setUserId('')
      setExpiresAt('')
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  async function revoke(uid: string) {
    await apiSend(`/api/sedes/${sedeId}/access/${uid}`, 'DELETE')
    load()
  }

  return (
    <Modal open onClose={onClose} title={`Accesos — ${detail?.name ?? ''}`}
      actions={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          {detail?.access.length === 0 && <p className="text-sm text-text-muted">Sin accesos otorgados.</p>}
          {detail?.access.map((a) => (
            <div key={a.userId} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-sm">
                {a.user.name} <span className="text-xs text-text-muted">{a.user.rol.name}</span>
                {a.expiresAt && <span className="ml-2 text-xs text-text-muted">vence {new Date(a.expiresAt).toLocaleDateString()}</span>}
              </span>
              <Button variant="ghost" onClick={() => revoke(a.userId)}>Revocar</Button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <Select
            label="Usuario"
            value={userId}
            onChange={setUserId}
            placeholder="Selecciona"
            options={users.map((u) => ({ value: u.user_id, label: `${u.name} (${u.rol.name})` }))}
          />
          <Input label="Expira (opcional)" type="date" value={expiresAt} onChange={setExpiresAt} />
          <div className="flex items-end">
            <Button onClick={grant} disabled={!userId}>Otorgar</Button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
