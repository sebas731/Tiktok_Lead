'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { DependentSelect } from '@/components/forms/DependentSelect'
import { apiSend } from '@/lib/api/client'
import { SALE_STATUS_OPTIONS, subStatusOptions } from '@/lib/constants/saleStatus'
import type { SaleRow } from '@/lib/types'

type Props = { sale: SaleRow; onClose: () => void; onSaved: () => void }

export function SaleStatusModal({ sale, onClose, onSaved }: Props) {
  const [reason, setReason] = useState(sale.reason)
  const [subReason, setSubReason] = useState(sale.sub_reason ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    setError('')
    try {
      await apiSend(`/api/sales/${sale.id_sale}/status`, 'PATCH', {
        reason,
        sub_reason: subReason || null,
      })
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Actualizar estado de venta"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading}>Actualizar estado</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select label="Estado de venta" value={reason} onChange={setReason} options={SALE_STATUS_OPTIONS} />
        <DependentSelect
          label="Submotivo"
          parentValue={reason}
          getOptions={subStatusOptions}
          value={subReason}
          onChange={setSubReason}
          placeholder="Selecciona"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
