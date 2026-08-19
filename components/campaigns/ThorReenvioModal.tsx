'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { apiSend } from '@/lib/api/client'
import type { Campaign } from '@/lib/types'

const THOR_CAMPS = ['s1','s2','s3','s4','s5','s6','c1','c2'] 

export function ThorReenvioModal({ campaign, onClose, onSaved }: { campaign: Campaign; onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState(campaign.thorMode ?? 'OFF')
  const [slug, setSlug] = useState(campaign.thorSlug ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setLoading(true); setError('')
    try {
      await apiSend(`/api/campaigns/${campaign.campaign_id}`, 'PATCH', { thorMode: mode, thorSlug: slug })
      onSaved(); onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} title="Reenvío a Thor" actions={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} loading={loading}>Guardar</Button></>}>
      <div className="flex flex-col gap-3">
        <Select label="Modo" value={mode} onChange={setMode} options={[
          { value: 'OFF', label: 'Desactivado' },
          { value: 'ESTRICTO', label: 'ESTRICTO' },
          { value: 'PARALELO', label: 'PARALELO' },
        ]} />
        <Select label="Campaña en Thor" value={slug} onChange={setSlug} placeholder="Elige" clearable
          options={THOR_CAMPS.map((s) => ({ value: s, label: s }))} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}