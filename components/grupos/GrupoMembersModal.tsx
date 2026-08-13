'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { apiGet, apiSend } from '@/lib/api/client'
import type { Grupo, Me } from '@/lib/types'

type Props = { grupo: Grupo; onClose: () => void; onChanged: () => void }

export function GrupoMembersModal({ grupo, onClose, onChanged }: Props) {
  const [asesores, setAsesores] = useState<Me[]>([])
  const [asesorId, setAsesorId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet<Me[]>('/api/users?role=ASESOR').then(setAsesores).catch(() => {})
  }, [])

  async function add() {
    if (!asesorId) return
    try {
      await apiSend(`/api/grupos/${grupo.grupo_id}/members`, 'POST', { asesorId })
      setAsesorId('')
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  async function remove(id: string) {
    await apiSend(`/api/grupos/${grupo.grupo_id}/members/${id}`, 'DELETE')
    onChanged()
  }

  return (
    <Modal open onClose={onClose} title={`Miembros — ${grupo.name}`}
      actions={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          {grupo.members.length === 0 && <p className="text-sm text-text-muted">Sin asesores en el grupo.</p>}
          {grupo.members.map((m) => (
            <div key={m.asesor.user_id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-sm">{m.asesor.name}</span>
              <Button variant="ghost" onClick={() => remove(m.asesor.user_id)}>Quitar</Button>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-3 border-t border-border pt-4">
          <div className="flex-1">
            <Select
              label="Agregar asesor"
              value={asesorId}
              onChange={setAsesorId}
              placeholder="Selecciona"
              options={asesores.map((a) => ({ value: a.user_id, label: a.name }))}
            />
          </div>
          <Button onClick={add} disabled={!asesorId}>Agregar</Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
