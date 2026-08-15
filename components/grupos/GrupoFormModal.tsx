'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiGet, apiSend } from '@/lib/api/client'
import { userLabel, type Grupo, type Me, type Sede } from '@/lib/types'

type Props = { open: boolean; onClose: () => void; onSaved: () => void; grupo?: Grupo | null; isAdmin?: boolean }

export function GrupoFormModal({ open, onClose, onSaved, grupo, isAdmin = true }: Props) {
  const isEdit = Boolean(grupo)
  const [name, setName] = useState(grupo?.name ?? '')
  const [supervisorId, setSupervisorId] = useState(grupo?.supervisor.user_id ?? '')
  const [sedeId, setSedeId] = useState(grupo?.sede?.sede_id ?? '')
  const [supervisores, setSupervisores] = useState<Me[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !isAdmin) return // solo el admin elige supervisor/sede
    apiGet<Me[]>('/api/users?role=SUPERVISOR').then(setSupervisores).catch(() => {})
    apiGet<Sede[]>('/api/sedes').then(setSedes).catch(() => {})
  }, [open, isAdmin])

  async function save() {
    setLoading(true)
    setError('')
    try {
      const body = { name, supervisorId, sedeId }
      if (isEdit && grupo) await apiSend(`/api/grupos/${grupo.grupo_id}`, 'PATCH', body)
      else await apiSend('/api/grupos', 'POST', body)
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
      title={isEdit ? 'Editar grupo' : 'Nuevo grupo'}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading} disabled={!name || (isAdmin && (!supervisorId || !sedeId))}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nombre" value={name} onChange={setName} />
        {isAdmin && (
          <>
            <Select
              label="Supervisor"
              value={supervisorId}
              onChange={setSupervisorId}
              placeholder="Selecciona un supervisor"
              options={supervisores.map((s) => ({ value: s.user_id, label: userLabel(s) }))}
            />
            <Select
              label="Sede"
              value={sedeId}
              onChange={setSedeId}
              placeholder="Selecciona una sede"
              options={sedes.map((s) => ({ value: s.sede_id, label: `${s.name} (${s.code})` }))}
            />
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
