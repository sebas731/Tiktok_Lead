'use client'

import { useCallback, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { apiGet, apiSend } from '@/lib/api/client'
import type { Sede } from '@/lib/types'
import { UserFormModal } from './UserFormModal'

type UserDetail = {
  user_id: string
  login: string
  email: string
  name: string
  first_last_name: string
  second_last_name: string
  department: string
  document_type: string
  document_number: string
  status: boolean
  rol: { id_rol: string; name: string }
  sedeAccess: { sedeId: string; expiresAt: string | null; sede: { code: string; name: string } }[]
  campaignAssignments: { campaign: { campaign_id: string; name: string } }[]
  membresiasGrupo: { grupo: { grupo_id: string; name: string } }[]
  gruposComoSupervisor: { grupo_id: string; name: string }[]
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg px-3 py-2">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-medium text-text">{value}</p>
    </div>
  )
}

export function UserDetailModal({ userId, onClose, onChanged }: { userId: string; onClose: () => void; onChanged: () => void }) {
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [tab, setTab] = useState('datos')
  const [sedes, setSedes] = useState<Sede[]>([])
  const [sedeId, setSedeId] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    apiGet<UserDetail>(`/api/users/${userId}`).then(setDetail).catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [userId])
  useEffect(load, [load])
  useEffect(() => {
    apiGet<Sede[]>('/api/sedes').then(setSedes).catch(() => {})
  }, [])

  async function grantSede() {
    if (!sedeId) return
    await apiSend(`/api/sedes/${sedeId}/access`, 'POST', { userId })
    setSedeId('')
    load()
  }
  async function revokeSede(sid: string) {
    await apiSend(`/api/sedes/${sid}/access/${userId}`, 'DELETE')
    load()
  }

  if (!detail) {
    return (
      <Modal open onClose={onClose} title="Usuario" size="lg" actions={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}>
        <p className="text-sm text-text-muted">{error || 'Cargando…'}</p>
      </Modal>
    )
  }

  const sedesLibres = sedes.filter((s) => !detail.sedeAccess.some((a) => a.sedeId === s.sede_id))

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${detail.name} ${detail.first_last_name}`}
      actions={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Badge tone={detail.status ? 'positivo' : 'neutral'}>{detail.status ? 'Activo' : 'Inactivo'}</Badge>
          <Badge tone="agendado">{detail.rol.name}</Badge>
        </div>

        <Tabs
          tabs={[
            { id: 'datos', label: 'Datos y rol' },
            { id: 'sedes', label: 'Sedes' },
            { id: 'otros', label: 'Campañas y grupo' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'datos' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Row label="Login" value={detail.login} />
              <Row label="Email" value={detail.email} />
              <Row label="Documento" value={`${detail.document_type} ${detail.document_number}`} />
              <Row label="Departamento" value={detail.department} />
              <Row label="Rol" value={detail.rol.name} />
              <Row label="Estado" value={detail.status ? 'Activo' : 'Inactivo'} />
            </div>
            <div><Button variant="secondary" onClick={() => setEditOpen(true)}>Editar datos / rol</Button></div>
          </div>
        )}

        {tab === 'sedes' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-bg p-3">
              <div className="min-w-[16rem] flex-1">
                <Select
                  label="Asignar sede"
                  value={sedeId}
                  onChange={setSedeId}
                  placeholder="Selecciona una sede"
                  options={sedesLibres.map((s) => ({ value: s.sede_id, label: `${s.code} — ${s.name}` }))}
                />
              </div>
              <Button onClick={grantSede} disabled={!sedeId}>Asignar</Button>
            </div>
            <div className="flex flex-col gap-2">
              {detail.sedeAccess.length === 0 && <p className="text-sm text-text-muted">Sin sedes asignadas.</p>}
              {detail.sedeAccess.map((a) => (
                <div key={a.sedeId} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span>{a.sede.code} — {a.sede.name}</span>
                  <Button variant="ghost" onClick={() => revokeSede(a.sedeId)}>Revocar</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'otros' && (
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-bg p-3">
              <p className="mb-2 text-xs font-medium text-text-muted">Campañas asignadas</p>
              {detail.campaignAssignments.length === 0 ? <p className="text-text-muted">Ninguna</p> :
                <ul className="list-disc pl-5">{detail.campaignAssignments.map((c) => <li key={c.campaign.campaign_id}>{c.campaign.name}</li>)}</ul>}
            </div>
            <div className="rounded-lg border border-border bg-bg p-3">
              <p className="mb-2 text-xs font-medium text-text-muted">Grupo</p>
              {detail.membresiasGrupo.map((m) => <p key={m.grupo.grupo_id}>Miembro de: {m.grupo.name}</p>)}
              {detail.gruposComoSupervisor.map((g) => <p key={g.grupo_id}>Supervisa: {g.name}</p>)}
              {detail.membresiasGrupo.length === 0 && detail.gruposComoSupervisor.length === 0 && <p className="text-text-muted">Sin grupo</p>}
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {editOpen && (
        <UserFormModal
          open
          user={{
            user_id: detail.user_id, login: detail.login, email: detail.email, name: detail.name,
            first_last_name: detail.first_last_name, second_last_name: detail.second_last_name,
            department: detail.department, document_type: detail.document_type,
            document_number: detail.document_number, status: detail.status, rol: detail.rol,
          }}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); load(); onChanged() }}
        />
      )}
    </Modal>
  )
}
