'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select, type SelectOption } from '@/components/ui/Select'
import { FormSection } from '@/components/forms/FormSection'
import { apiGet, apiSend } from '@/lib/api/client'
import { SALE_SECTIONS, defaultSaleValues } from '@/lib/constants/saleForm'
import { userLabel, type Campaign, type Me } from '@/lib/types'
import { SaleFieldInput } from './SaleFieldInput'

type Props = { leadId?: string; campaignId?: string; onSaved: () => void; onCancel: () => void }

export function SaleForm({ leadId, campaignId, onSaved, onCancel }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [supervisores, setSupervisores] = useState<SelectOption[]>([])
  const [campaign, setCampaign] = useState(campaignId ?? '')
  const [values, setValues] = useState<Record<string, string>>(defaultSaleValues)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiGet<Campaign[]>('/api/campaigns').then(setCampaigns).catch(() => {})
    apiGet<Me[]>('/api/users?role=SUPERVISOR')
      .then((u) => setSupervisores(u.map((s) => ({ value: s.user_id, label: userLabel(s) }))))
      .catch(() => {})
  }, [])

  const set = (k: string) => (v: string) => setValues((s) => ({ ...s, [k]: v }))
  const setMany = (patch: Record<string, string>) => setValues((s) => ({ ...s, ...patch }))

  async function submit() {
    setLoading(true)
    setError('')
    try {
      // La sede la asigna el backend automáticamente según el usuario.
      await apiSend('/api/sales', 'POST', {
        campaingId: campaign,
        ...(leadId ? { leadId } : {}),
        ...values,
        pack_price: values.pack_price ? Number(values.pack_price) : undefined,
        total_price: values.total_price ? Number(values.total_price) : undefined,
      })
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar la venta')
    } finally {
      setLoading(false)
    }
  }

  const advisorSections = SALE_SECTIONS.filter((s) => s.title !== 'Back office')

  return (
    <div className="flex flex-col gap-6">
      <FormSection title="Campaña" description="La sede se asigna automáticamente según tu usuario.">
        <Select
          label="Campaña"
          value={campaign}
          onChange={setCampaign}
          placeholder="Selecciona"
          disabled={Boolean(campaignId)}
          options={campaigns.map((c) => ({ value: c.campaign_id, label: c.name }))}
        />
      </FormSection>

      {advisorSections.map((section) => (
        <FormSection key={section.title} title={section.title}>
          {section.fields.map((f) => (
            <SaleFieldInput key={f.name} field={f} value={values[f.name] ?? ''} onChange={set(f.name)} supervisores={supervisores} values={values} setMany={setMany} />
          ))}
        </FormSection>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-bg/80 py-3 backdrop-blur">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button onClick={submit} loading={loading} disabled={!campaign}>Guardar venta</Button>
      </div>
    </div>
  )
}
