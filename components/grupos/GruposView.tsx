'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet } from '@/lib/api/client'
import type { Grupo, Role } from '@/lib/types'
import { GrupoFormModal } from './GrupoFormModal'
import { GrupoMembersModal } from './GrupoMembersModal'

export function GruposView({ role }: { role: Role }) {
  const isAdmin = role === 'ADMIN'
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [form, setForm] = useState<{ open: boolean; grupo?: Grupo | null }>({ open: false })
  const [members, setMembers] = useState<Grupo | null>(null)
  const [error, setError] = useState('')

  function load() {
    apiGet<Grupo[]>('/api/grupos')
      .then(setGrupos)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }
  useEffect(load, [])

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Grupos' : 'Mi grupo'}
        actions={isAdmin ? <Button onClick={() => setForm({ open: true, grupo: null })}>Nuevo grupo</Button> : undefined}
      />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {grupos.length === 0 ? (
        <EmptyState title="Sin grupos" description="Aún no hay grupos configurados." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {grupos.map((g) => (
            <Card key={g.grupo_id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-text">{g.name}</p>
                  <p className="text-xs text-text-muted">Supervisor: {g.supervisor.name}</p>
                  {g.sede && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-red/10 px-2 py-0.5 text-[11px] font-medium text-brand-red">
                      🏢 {g.sede.name}
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button variant="ghost" onClick={() => setForm({ open: true, grupo: g })}>Editar</Button>
                    <Button variant="ghost" onClick={() => setMembers(g)}>Miembros</Button>
                  </div>
                )}
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1 text-xs font-medium text-text-muted">Asesores ({g.members.length})</p>
                <ul className="flex flex-wrap gap-2">
                  {g.members.map((m) => (
                    <li key={m.asesor.user_id} className="rounded-full bg-bg px-2.5 py-0.5 text-xs text-text">
                      {m.asesor.name}
                    </li>
                  ))}
                  {g.members.length === 0 && <li className="text-xs text-text-muted">Sin asesores</li>}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}
      <GrupoFormModal open={form.open} grupo={form.grupo} onClose={() => setForm({ open: false })} onSaved={load} />
      {members && (
        <GrupoMembersModal
          grupo={members}
          onClose={() => setMembers(null)}
          onChanged={() => {
            load()
            setMembers(null)
          }}
        />
      )}
    </div>
  )
}
