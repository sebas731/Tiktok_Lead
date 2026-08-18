'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiSend } from '@/lib/api/client'
import type { Lead } from '@/lib/types'

type Props = {
  onClose: () => void
  onReclaimed: (lead: Lead) => void
}

/** Corregir lead: el asesor trae por número un lead suyo (aunque sea viejo) para corregirlo. */
export function CorregirLeadModal({ onClose, onReclaimed }: Props) {
  const [number, setNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function buscar() {
    setLoading(true)
    setError('')
    try {
      const lead = await apiSend<Lead>('/api/leads/reclaim-by-number', 'POST', { number })
      onReclaimed(lead)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo traer el lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Corregir lead"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={buscar} loading={loading} disabled={number.replace(/\D/g, '').length < 6}>
            Traer lead
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-muted">
          Escribe el <b>número</b> de un lead que ya gestionaste (aunque sea viejo o esté en NO_CONTACTO).
          Se te asignará para que lo abras y lo corrijas (por ejemplo, marcarlo como venta).
        </p>
        <Input label="Número del lead" value={number} onChange={setNumber} placeholder="Ej. 976752112" />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
