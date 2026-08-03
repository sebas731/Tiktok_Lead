'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
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
  const [asesores, setAsesores] = useState<Me[]>([])
  const [asesorId, setAsesorId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    apiGet<Me[]>('/api/users')
      .then((all) => setAsesores(all.filter((u) => u.rol.name === 'ASESOR')))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [open])

  async function assign() {
    setLoading(true)
    setError('')
    try {
      await apiSend('/api/leads/assign', 'POST', { campaignId, asesorId, leadIds })
      onAssigned()
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
      title={`Asignar ${leadIds.length} lead(s)`}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={assign} loading={loading} disabled={!asesorId}>Asignar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Asesor"
          value={asesorId}
          onChange={setAsesorId}
          placeholder="Selecciona un asesor"
          options={asesores.map((a) => ({ value: a.user_id, label: a.name }))}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
