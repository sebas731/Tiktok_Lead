'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiGet, apiSend } from '@/lib/api/client'
import { SALE_FIELDS } from '@/lib/constants/leads'
import type { Lead, SaleDetail } from '@/lib/types'

type Props = { lead: Lead; onClose: () => void; onSaved: () => void }

export function SaleEditModal({ lead, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiGet<SaleDetail>(`/api/leads/${lead.id}/sale`)
      .then((s) => {
        const next: Record<string, string> = {}
        for (const f of SALE_FIELDS) {
          const v = (s as Record<string, unknown>)[f.name]
          next[f.name] = v == null ? '' : String(v)
        }
        setValues(next)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [lead.id])

  async function save() {
    setLoading(true)
    setError('')
    try {
      await apiSend(`/api/leads/${lead.id}/sale`, 'PATCH', {
        ...values,
        numeroLlamadas: Number(values.numeroLlamadas ?? 0),
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
      title={`Venta — ${lead.client_number}`}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading}>Guardar</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SALE_FIELDS.map((f) =>
          f.kind === 'select' ? (
            <Select
              key={f.name}
              label={f.label}
              value={values[f.name] ?? ''}
              onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
              options={f.options ?? []}
            />
          ) : (
            <Input
              key={f.name}
              label={f.label}
              type={f.kind === 'number' ? 'number' : 'text'}
              value={values[f.name] ?? ''}
              onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
            />
          )
        )}
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
