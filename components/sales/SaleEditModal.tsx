'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormSection } from '@/components/forms/FormSection'
import { apiGet, apiSend } from '@/lib/api/client'
import { SALE_SECTIONS, CLIENT_FIELD_NAMES } from '@/lib/constants/saleForm'
import type { Me, SaleRow } from '@/lib/types'
import { SaleFieldInput } from './SaleFieldInput'
import type { SelectOption } from '@/components/ui/Select'

type SaleFull = { id_sale: string; client: Record<string, unknown> } & Record<string, unknown>

function asStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10)
  return String(v)
}

type Props = { sale: SaleRow; onClose: () => void; onSaved: () => void }

export function SaleEditModal({ sale, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [supervisores, setSupervisores] = useState<SelectOption[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiGet<Me[]>('/api/users?role=SUPERVISOR')
      .then((u) => setSupervisores(u.map((s) => ({ value: s.user_id, label: s.name }))))
      .catch(() => {})
    apiGet<SaleFull>(`/api/sales/${sale.id_sale}`)
      .then((d) => {
        const init: Record<string, string> = {}
        for (const section of SALE_SECTIONS) {
          for (const f of section.fields) {
            const raw = CLIENT_FIELD_NAMES.has(f.name) ? d.client?.[f.name] : d[f.name]
            init[f.name] = asStr(raw)
          }
        }
        setValues(init)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [sale.id_sale])

  const set = (k: string) => (v: string) => setValues((s) => ({ ...s, [k]: v }))
  const setMany = (patch: Record<string, string>) => setValues((s) => ({ ...s, ...patch }))

  async function save() {
    setLoading(true)
    setError('')
    try {
      await apiSend(`/api/sales/${sale.id_sale}`, 'PATCH', {
        ...values,
        pack_price: values.pack_price ? Number(values.pack_price) : undefined,
        total_price: values.total_price ? Number(values.total_price) : undefined,
        consolidado: values.consolidado ? Number(values.consolidado) : undefined,
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
      size="xl"
      title={`Editar venta — ${sale.code}`}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {SALE_SECTIONS.map((section) => (
          <FormSection key={section.title} title={section.title}>
            {section.fields.map((f) => (
              <SaleFieldInput key={f.name} field={f} value={values[f.name] ?? ''} onChange={set(f.name)} supervisores={supervisores} values={values} setMany={setMany} />
            ))}
          </FormSection>
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
