'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiSend } from '@/lib/api/client'
import type { Sede } from '@/lib/types'

type Props = { open: boolean; onClose: () => void; onSaved: () => void; sede?: Sede | null }

export function SedeFormModal({ open, onClose, onSaved, sede }: Props) {
  const isEdit = Boolean(sede)
  const [code, setCode] = useState(sede?.code ?? '')
  const [name, setName] = useState(sede?.name ?? '')
  const [address, setAddress] = useState(sede?.address ?? '')
  const [status, setStatus] = useState(sede?.status ?? true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    setError('')
    try {
      const body = { code, name, address, ...(isEdit ? { status } : {}) }
      if (isEdit && sede) await apiSend(`/api/sedes/${sede.sede_id}`, 'PATCH', body)
      else await apiSend('/api/sedes', 'POST', body)
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
      title={isEdit ? 'Editar sede' : 'Nueva sede'}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Código" value={code} onChange={setCode} placeholder="Ej. LIM01" />
        <Input label="Nombre" value={name} onChange={setName} />
        <Input label="Dirección" value={address} onChange={setAddress} />
        {isEdit && (
          <Select
            label="Estado"
            value={status ? 'true' : 'false'}
            onChange={(v) => setStatus(v === 'true')}
            options={[
              { value: 'true', label: 'Activa' },
              { value: 'false', label: 'Inactiva' },
            ]}
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
