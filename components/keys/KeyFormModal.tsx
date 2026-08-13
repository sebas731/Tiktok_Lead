'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiSend } from '@/lib/api/client'
import type { KeyRow } from '@/lib/types'

type Props = { open: boolean; onClose: () => void; onSaved: () => void; keyRow?: KeyRow | null }

export function KeyFormModal({ open, onClose, onSaved, keyRow }: Props) {
  const isEdit = Boolean(keyRow)
  const [name, setName] = useState(keyRow?.name ?? '')
  const [advertiserId, setAdvertiserId] = useState(keyRow?.advertiserId ?? '')
  const [accessToken, setAccessToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [expiresAt, setExpiresAt] = useState(keyRow?.expiresAt ? keyRow.expiresAt.slice(0, 10) : '')
  const [status, setStatus] = useState(keyRow?.status ?? true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    setError('')
    try {
      const body: Record<string, unknown> = { name, advertiserId, expiresAt, status }
      // En edición el token es opcional: si se deja vacío, se conserva el actual.
      if (!isEdit || accessToken) body.accessToken = accessToken
      if (isEdit && keyRow) await apiSend(`/api/keys/${keyRow.id}`, 'PATCH', body)
      else await apiSend('/api/keys', 'POST', body)
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const disabled = !name || !advertiserId || (!isEdit && !accessToken)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar Key' : 'Nueva Key'}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading} disabled={disabled}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nombre" value={name} onChange={setName} placeholder="Comunik2 Peru Sac" />
        <Input label="Advertiser ID" value={advertiserId} onChange={setAdvertiserId} placeholder="7338511714075328513" />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Access Token"
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={setAccessToken}
                placeholder={isEdit ? 'Dejar vacío para conservar el token actual' : 'Pega el token de TikTok'}
              />
            </div>
            <Button variant="secondary" onClick={() => setShowToken((v) => !v)}>
              {showToken ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
          <p className="text-xs text-text-muted">El token da acceso a la cuenta publicitaria. No se muestra completo en el listado.</p>
        </div>

        <Input label="Fecha de expiración (opcional)" type="date" value={expiresAt} onChange={setExpiresAt} />
        <Select
          label="Estado"
          value={status ? 'true' : 'false'}
          onChange={(v) => setStatus(v === 'true')}
          options={[
            { value: 'true', label: 'Activa' },
            { value: 'false', label: 'Inactiva' },
          ]}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
