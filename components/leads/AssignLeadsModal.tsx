'use client'

import { useCallback, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiGet, apiSend } from '@/lib/api/client'
import type { Me } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  onAssigned: () => void
  campaignId: string
  leadIds: string[]
}

export function AssignLeadsModal({ open, onClose, onAssigned, campaignId, leadIds }: Props) {
  const manual = leadIds.length > 0
  const [asesores, setAsesores] = useState<Me[]>([])
  const [asesorId, setAsesorId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // /api/users ya devuelve solo asesores del grupo si es SUPERVISOR.
  const loadAsesores = useCallback(() => {
    const q = search ? `&search=${encodeURIComponent(search)}` : ''
    apiGet<Me[]>(`/api/users?role=ASESOR${q}`)
      .then(setAsesores)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [search])

  useEffect(() => {
    if (open) loadAsesores()
  }, [open, loadAsesores])

  async function assign() {
    setLoading(true)
    setError('')
    try {
      const body = manual
        ? { campaignId, asesorId, leadIds }
        : { campaignId, asesorId, cantidad: Number(cantidad) }
      await apiSend('/api/leads/assign', 'POST', body)
      onAssigned()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al asignar')
    } finally {
      setLoading(false)
    }
  }

  const disabled = !asesorId || (!manual && (!cantidad || Number(cantidad) <= 0))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={manual ? `Asignar ${leadIds.length} lead(s) seleccionados` : 'Asignar leads sin asignar'}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={assign} loading={loading} disabled={disabled}>Asignar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Buscar asesor (nombre o DNI)" value={search} onChange={setSearch} placeholder="Vacío: tu grupo · Escribe: cualquier asesor" />
        <Select
          label="Asesor"
          value={asesorId}
          onChange={setAsesorId}
          placeholder="Selecciona un asesor"
          options={asesores.map((a) => ({ value: a.user_id, label: `${a.name} — ${a.document_number}` }))}
        />
        {!manual && (
          <Input label="Cantidad de leads sin asignar" type="number" value={cantidad} onChange={setCantidad} />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
