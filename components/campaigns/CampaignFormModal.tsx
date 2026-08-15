'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiGet, apiSend } from '@/lib/api/client'
import type { Campaign, KeyRow } from '@/lib/types'
import { ExcelOriginFields } from './ExcelOriginFields'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  campaign?: Campaign | null
}

const SOURCE_OPTIONS = [
  { value: 'TIKTOK', label: 'TikTok Ads' },
  { value: 'EXCEL', label: 'Google Sheet (Excel)' },
]

export function CampaignFormModal({ open, onClose, onSaved, campaign }: Props) {
  const isEdit = Boolean(campaign)
  const [name, setName] = useState(campaign?.name ?? '')
  const [denomination, setDenomination] = useState(campaign?.denomination ?? '')
  const [status, setStatus] = useState(campaign?.status ?? true)
  const [leadMode, setLeadMode] = useState<'NORMAL' | 'AUTO'>(campaign?.leadMode ?? 'NORMAL')
  const [allowNoContactoPull, setAllowNoContactoPull] = useState(campaign?.allowNoContactoPull ?? false)
  const [autoSync, setAutoSync] = useState(campaign?.autoSync ?? true)
  const [source, setSource] = useState<'TIKTOK' | 'EXCEL'>(campaign?.source ?? 'TIKTOK')
  const [tiktokCampaignId, setTiktokCampaignId] = useState(campaign?.tiktokCampaignId ?? '')
  const [keyId, setKeyId] = useState(campaign?.keyId ?? '')
  const [keys, setKeys] = useState<KeyRow[]>([])
  const [excelUrl, setExcelUrl] = useState(campaign?.excelUrl ?? '')
  const [excelGid, setExcelGid] = useState(campaign?.excelGid ?? '')
  const [excelSheetName, setExcelSheetName] = useState(campaign?.excelSheetName ?? '')
  const [sheetAccessMode, setSheetAccessMode] = useState<'PUBLIC_CSV' | 'SERVICE_ACCOUNT'>(
    campaign?.sheetAccessMode ?? 'PUBLIC_CSV',
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Solo Keys activas para elegir (una Key inactiva no debería usarse en campañas nuevas).
  const activeKeys = useMemo(() => keys.filter((k) => k.status || k.id === keyId), [keys, keyId])
  const selectedKey = keys.find((k) => k.id === keyId)

  useEffect(() => {
    if (open && source === 'TIKTOK') apiGet<KeyRow[]>('/api/keys').then(setKeys).catch(() => {})
  }, [open, source])

  async function save() {
    setLoading(true)
    setError('')
    try {
      // El Advertiser ID lo deriva el backend desde la Key.
      const tiktokBody = { tiktokCampaignId, keyId }
      const excelBody = { excelUrl, excelGid, excelSheetName, sheetAccessMode, autoSync }
      const originBody = source === 'TIKTOK' ? tiktokBody : excelBody

      // Solo aplica en modo AUTO; en NORMAL se fuerza false para no dejar el flag colgado.
      const allowNC = leadMode === 'AUTO' ? allowNoContactoPull : false

      if (isEdit && campaign) {
        await apiSend(`/api/campaigns/${campaign.campaign_id}`, 'PATCH', { name, denomination, status, leadMode, allowNoContactoPull: allowNC, ...originBody })
      } else {
        await apiSend('/api/campaigns', 'POST', { name, denomination, source, leadMode, allowNoContactoPull: allowNC, ...originBody })
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
          <Button
            onClick={save}
            loading={loading}
            disabled={source === 'TIKTOK' ? !keyId : !excelUrl || !excelGid}
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nombre" value={name} onChange={setName} />
        <Input label="Denominación" value={denomination} onChange={setDenomination} />
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

        <Select
          label="Modo de asignación de leads"
          value={leadMode}
          onChange={(v) => setLeadMode(v as 'NORMAL' | 'AUTO')}
          options={[
            { value: 'NORMAL', label: 'Normal (el supervisor asigna los leads)' },
            { value: 'AUTO', label: 'Automático (los asesores atienden todos los leads)' },
          ]}
        />

        {leadMode === 'AUTO' && (
          <label className="flex items-start gap-2.5 rounded-lg border border-border bg-surface px-3.5 py-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={allowNoContactoPull}
              onChange={(e) => setAllowNoContactoPull(e.target.checked)}
            />
            <span>
              <span className="font-medium text-text">Permitir jalar leads NO_CONTACTO</span>
              <span className="mt-0.5 block text-text-muted">
                Los asesores podrán autoasignarse también leads en NO_CONTACTO, ignorando el enfriamiento de 5&nbsp;h.
              </span>
            </span>
          </label>
        )}

        <Select
          label="Origen"
          value={source}
          onChange={(v) => setSource(v as 'TIKTOK' | 'EXCEL')}
          options={SOURCE_OPTIONS}
          disabled={isEdit}
        />

        {source === 'TIKTOK' ? (
          <>
            {keys.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
                No hay Keys registradas. Crea una primero en{' '}
                <Link href="/dashboard/keys" className="font-semibold underline">Gestión de Keys</Link>.
              </div>
            ) : (
              <>
                <Select
                  label="Key (cuenta publicitaria)"
                  value={keyId}
                  onChange={setKeyId}
                  placeholder="Selecciona una Key"
                  options={activeKeys.map((k) => ({ value: k.id, label: `${k.name} — ${k.advertiserId}` }))}
                />
                {selectedKey && (
                  <Input label="Advertiser ID (de la Key)" value={selectedKey.advertiserId} onChange={() => {}} disabled />
                )}
              </>
            )}
            <Input label="TikTok Campaign ID" value={tiktokCampaignId} onChange={setTiktokCampaignId} />
          </>
        ) : (
          <ExcelOriginFields
            excelUrl={excelUrl}
            setExcelUrl={setExcelUrl}
            sheetAccessMode={sheetAccessMode}
            setSheetAccessMode={setSheetAccessMode}
            excelGid={excelGid}
            setExcelGid={setExcelGid}
            excelSheetName={excelSheetName}
            setExcelSheetName={setExcelSheetName}
            autoSync={autoSync}
            setAutoSync={setAutoSync}
            campaign={campaign}
            onSynced={onSaved}
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
