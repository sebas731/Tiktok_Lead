'use client'

import { useCallback, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiGet, apiSend } from '@/lib/api/client'
import { userLabel, fullName, type Me } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  onAssigned: () => void
  campaignId: string
  leadIds: string[]
}

export function AssignLeadsModal({ open, onClose, onAssigned, campaignId, leadIds }: Props) {
  const manual = leadIds.length > 0
  const [asesores, setAsesores] = useState<Me[]>([])
  const [asesorId, setAsesorId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // /api/users ya devuelve solo asesores del grupo si es SUPERVISOR.
  const loadAsesores = useCallback((term: string) => {
    const q = term ? `&search=${encodeURIComponent(term)}` : ''
    apiGet<Me[]>(`/api/users?role=ASESOR${q}`)
      .then(setAsesores)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [])

  // Búsqueda con lupa: se refresca la lista al escribir (con un pequeño debounce).
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => loadAsesores(search), 250)
    return () => clearTimeout(t)
  }, [open, search, loadAsesores])

  const selected = asesores.find((a) => a.user_id === asesorId)

  async function assign() {
    setLoading(true)
    setError('')
    try {
      const body = manual
        ? { campaignId, asesorId, leadIds }
        : { campaignId, asesorId, cantidad: Number(cantidad) }
      await apiSend('/api/leads/assign', 'POST', body)
      onAssigned()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al asignar')
    } finally {
      setLoading(false)
    }
  }

  const disabled = !asesorId || (!manual && (!cantidad || Number(cantidad) <= 0))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={manual ? `Asignar ${leadIds.length} lead(s) seleccionados` : 'Asignar leads sin asignar'}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={assign} loading={loading} disabled={disabled}>Asignar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Buscar asesor (nombre o DNI)</label>
          <div className="relative">
            {/* Lupa */}
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"
            >
              <circle cx="9" cy="9" r="6" />
              <path d="m14 14 3.5 3.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Vacío: tu grupo · Escribe: cualquier asesor"
              className="w-full rounded-xl border border-border bg-bg/40 py-2.5 pl-9 pr-3.5 text-sm outline-none transition focus:border-brand-red focus:bg-white focus:ring-2 focus:ring-brand-red/15"
            />
          </div>

          {/* Lista de resultados clickeable */}
          <div className="mt-1 max-h-56 divide-y divide-border overflow-auto rounded-xl border border-border">
            {asesores.length === 0 ? (
              <p className="px-3.5 py-4 text-sm text-text-muted">No hay asesores para “{search}”.</p>
            ) : (
              asesores.map((a) => {
                const active = a.user_id === asesorId
                return (
                  <button
                    key={a.user_id}
                    type="button"
                    onClick={() => setAsesorId(a.user_id)}
                    className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition ${
                      active ? 'bg-brand-red/10 font-medium text-brand-red' : 'hover:bg-bg'
                    }`}
                  >
                    <span>
                      {fullName(a)}
                      {a.document_number && <span className="ml-2 font-mono text-xs text-text-muted">{a.document_number}</span>}
                    </span>
                    {active && (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m5 10 3.5 3.5L15 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                )
              })
            )}
          </div>
          {selected && (
            <p className="text-xs text-text-muted">Seleccionado: <span className="font-medium text-text">{userLabel(selected)}</span></p>
          )}
        </div>

        {!manual && (
          <Input label="Cantidad de leads sin asignar" type="number" value={cantidad} onChange={setCantidad} />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
