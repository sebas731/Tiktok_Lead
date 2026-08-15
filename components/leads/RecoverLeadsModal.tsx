'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { apiGet, apiSend } from '@/lib/api/client'
import { userLabel, type Lead } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  onRecovered: () => void
  campaignId: string
}

type Grupo = {
  asesorId: string
  label: string
  leads: Lead[]
}

export function RecoverLeadsModal({ open, onClose, onRecovered, campaignId }: Props) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    // Leads asignados que siguen SIN_GESTION en la campaña.
    apiGet<Lead[]>(`/api/leads?campaignId=${campaignId}&status=SIN_GESTION`)
      .then((all) => setLeads(all.filter((l) => l.asignadoAId)))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [campaignId])

  useEffect(() => {
    if (!open) return
    setSearch('')
    setSelected(new Set())
    setExpanded(new Set())
    load()
  }, [open, load])

  // Agrupa por asesor, aplicando el buscador (por nombre/DNI del asesor o número del lead).
  const grupos = useMemo<Grupo[]>(() => {
    const term = search.trim().toLowerCase()
    const map = new Map<string, Grupo>()
    for (const l of leads) {
      const a = l.asignadoA
      if (!a) continue
      const label = userLabel(a)
      const asesorMatch = !term || label.toLowerCase().includes(term)
      const leadMatch = !term || l.client_number.toLowerCase().includes(term)
      if (term && !asesorMatch && !leadMatch) continue
      // Si el término coincide con el asesor, se muestran todos sus leads; si solo
      // coincide el número, se muestra únicamente ese lead.
      if (!map.has(a.user_id)) map.set(a.user_id, { asesorId: a.user_id, label, leads: [] })
      map.get(a.user_id)!.leads.push(l)
    }
    return [...map.values()].sort((x, y) => x.label.localeCompare(y.label))
  }, [leads, search])

  const searching = search.trim().length > 0

  function toggleExpand(asesorId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(asesorId)) next.delete(asesorId)
      else next.add(asesorId)
      return next
    })
  }

  function toggleLead(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleGrupo(g: Grupo) {
    const allSelected = g.leads.every((l) => selected.has(l.id))
    setSelected((prev) => {
      const next = new Set(prev)
      for (const l of g.leads) {
        if (allSelected) next.delete(l.id)
        else next.add(l.id)
      }
      return next
    })
  }

  async function recover() {
    setSaving(true)
    setError('')
    try {
      await apiSend('/api/leads/recover', 'POST', { campaignId, leadIds: [...selected] })
      onRecovered()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al recuperar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Recuperar leads asignados sin gestión"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={recover} loading={saving} disabled={selected.size === 0}>
            Recuperar ({selected.size})
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-muted">
          Los leads seleccionados se desasignan y vuelven al pool para que otros los tomen.
        </p>

        {/* Buscador con lupa */}
        <div className="relative">
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
            placeholder="Buscar por asesor (nombre/DNI) o número de lead…"
            className="w-full rounded-xl border border-border bg-bg/40 py-2.5 pl-9 pr-3.5 text-sm outline-none transition focus:border-brand-red focus:bg-white focus:ring-2 focus:ring-brand-red/15"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="max-h-[26rem] divide-y divide-border overflow-auto rounded-xl border border-border">
          {loading ? (
            <p className="px-3.5 py-6 text-center text-sm text-text-muted">Cargando…</p>
          ) : grupos.length === 0 ? (
            <p className="px-3.5 py-6 text-center text-sm text-text-muted">
              {searching ? 'Sin resultados para tu búsqueda.' : 'No hay leads asignados sin gestión.'}
            </p>
          ) : (
            grupos.map((g) => {
              const isOpen = searching || expanded.has(g.asesorId)
              const selCount = g.leads.filter((l) => selected.has(l.id)).length
              const allSel = selCount === g.leads.length && g.leads.length > 0
              return (
                <div key={g.asesorId}>
                  {/* Cabecera del asesor */}
                  <div className="flex items-center gap-2 bg-bg/40 px-3.5 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand(g.asesorId)}
                      className="flex flex-1 items-center gap-2 text-left text-sm font-medium text-text"
                    >
                      <svg
                        className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
                      >
                        <path d="m7 5 6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{g.label}</span>
                      <span className="rounded-full bg-border/60 px-2 py-0.5 text-xs text-text-muted">{g.leads.length}</span>
                      {selCount > 0 && (
                        <span className="rounded-full bg-brand-red/10 px-2 py-0.5 text-xs font-medium text-brand-red">
                          {selCount} sel.
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleGrupo(g)}
                      className="text-xs font-medium text-brand-red hover:underline"
                    >
                      {allSel ? 'Quitar todos' : 'Seleccionar todos'}
                    </button>
                  </div>

                  {/* Leads del asesor */}
                  {isOpen &&
                    g.leads.map((l) => (
                      <label
                        key={l.id}
                        className="flex cursor-pointer items-center gap-3 border-t border-border/60 px-3.5 py-2 pl-10 text-sm hover:bg-bg"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(l.id)}
                          onChange={() => toggleLead(l.id)}
                        />
                        <span className="font-mono text-text">{l.client_number}</span>
                        {l.name_client && <span className="text-text-muted">· {l.name_client}</span>}
                      </label>
                    ))}
                </div>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}
