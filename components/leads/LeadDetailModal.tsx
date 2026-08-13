'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { apiSend } from '@/lib/api/client'
import { STATUS_OPTIONS, substatusOptions } from '@/lib/constants/leads'
import type { Lead } from '@/lib/types'

type Props = {
  lead: Lead
  onClose: () => void
  onSaved: () => void
  onRegisterVenta?: () => void
}

// Modal de GESTIÓN del lead (no de venta). El flujo de venta vive aparte
// (modelo Venta + /api/ventas) y se construye en fases posteriores.
export function LeadDetailModal({ lead, onClose, onSaved, onRegisterVenta }: Props) {
  const [status, setStatus] = useState(lead.status)
  const [subStatus, setSubStatus] = useState(lead.sub_status)
  const [observations, setObservations] = useState(lead.observations ?? '')
  const [reason, setReason] = useState(lead.reason ?? '')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const subOptions = substatusOptions(status)

  function onStatusChange(value: string) {
    setStatus(value)
    const allowed = substatusOptions(value)
    if (!allowed.some((o) => o.value === subStatus)) setSubStatus(allowed[0]?.value ?? 'OTRO')
  }

  async function copyNumber() {
    await navigator.clipboard.writeText(lead.client_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function save() {
    setLoading(true)
    setError('')
    try {
      await apiSend(`/api/leads/${lead.id}`, 'PATCH', {
        status,
        sub_status: subStatus,
        observations,
        reason,
      })
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
      open
      onClose={onClose}
      title={`Lead ${lead.client_number}`}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={copyNumber}>Copiar número</Button>
          {copied && <span className="text-sm text-green-600">Copiado ✓</span>}
        </div>
        <Select label="Estado" value={status} onChange={onStatusChange} options={STATUS_OPTIONS} />
        <Select label="Sub-estado" value={subStatus} onChange={setSubStatus} options={subOptions} />
        <Textarea label="Observaciones" value={observations} onChange={setObservations} />
        <Textarea label="Motivo" value={reason} onChange={setReason} rows={2} />
        {status === 'POSITIVO' && lead.status === 'POSITIVO' && !lead.sale && onRegisterVenta && (
          <Button variant="secondary" onClick={onRegisterVenta}>Registrar venta</Button>
        )}
        {status === 'POSITIVO' && lead.sale && (
          <p className="text-sm text-text-muted">Este lead ya tiene una venta registrada.</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
