'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiSend } from '@/lib/api/client'
import type { Campaign } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  campaign?: Campaign | null
}

export function CampaignFormModal({ open, onClose, onSaved, campaign }: Props) {
  const isEdit = Boolean(campaign)
  const [name, setName] = useState(campaign?.name ?? '')
  const [denomination, setDenomination] = useState(campaign?.denomination ?? '')
  const [tiktokCampaignId, setTiktokCampaignId] = useState('')
  const [tiktokAdvertiserId, setTiktokAdvertiserId] = useState('')
  const [keyId, setKeyId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    setError('')
    try {
      if (isEdit && campaign) {
        await apiSend(`/api/campaigns/${campaign.campaign_id}`, 'PATCH', { name, denomination })
      } else {
        await apiSend('/api/campaigns', 'POST', {
          name,
          denomination,
          tiktokCampaignId,
          tiktokAdvertiserId,
          keyId,
        })
      }
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
      title={isEdit ? 'Editar campaña' : 'Nueva campaña'}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nombre" value={name} onChange={setName} />
        <Input label="Denominación" value={denomination} onChange={setDenomination} />
        {!isEdit && (
          <>
            <Input label="TikTok Campaign ID" value={tiktokCampaignId} onChange={setTiktokCampaignId} />
            <Input label="TikTok Advertiser ID" value={tiktokAdvertiserId} onChange={setTiktokAdvertiserId} />
            <Input label="Key ID" value={keyId} onChange={setKeyId} placeholder="ID de una Key existente" />
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
