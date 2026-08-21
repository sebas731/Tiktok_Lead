'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { apiGet, apiSend } from '@/lib/api/client'
import { userLabel, type Me } from '@/lib/types'

type Props = { campaignId: string; onClose: () => void; onDone: () => void }

/**
 * Un número por línea (o separados por coma/;). Se limpian +51, espacios y
 * guiones dentro de cada número. Se queda con los que tengan 6+ dígitos.
 */
function parseNumbers(text: string): string[] {
  const tokens = text
    .split(/[\n,;]+/)
    .map((t) => t.replace(/\D/g, ''))
    .filter((t) => t.length >= 6)
  return [...new Set(tokens)]
}

export function BulkLeadsModal({ campaignId, onClose, onDone }: Props) {
  const [text, setText] = useState('')
  const [asesores, setAsesores] = useState<Me[]>([])
  const [asesorId, setAsesorId] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiGet<Me[]>('/api/users?role=ASESOR').then(setAsesores).catch(() => {})
  }, [])

  const numbers = parseNumbers(text)

  async function asignar() {
    if (!asesorId || numbers.length === 0) return
    setLoading(true); setError(''); setMsg('')
    try {
      const r = await apiSend<{ assigned: number }>('/api/leads/assign', 'POST', { campaignId, asesorId, numbers })
      setMsg(`Asignados ${r.assigned} de ${numbers.length} números.`)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al asignar')
    } finally {
      setLoading(false)
    }
  }

  async function reingresar() {
    if (numbers.length === 0) return
    if (!window.confirm(`¿Reingresar ${numbers.length} lead(s) a "Sin gestión"? (no afecta a los vendidos)`)) return
    setLoading(true); setError(''); setMsg('')
    try {
      const r = await apiSend<{ reingresados: number; pedidos: number }>('/api/leads/reingresar', 'POST', { campaignId, numbers })
      setMsg(`Reingresados ${r.reingresados} de ${r.pedidos} números.`)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al reingresar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Asignar / Reingresar por lista"
      actions={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}
    >
      <div className="flex flex-col gap-4">
        <div>
          <Textarea
            label="Pega los números (uno por línea o separados por comas/espacios)"
            value={text}
            onChange={setText}
            rows={6}
          />
          <p className="mt-1 text-xs text-text-muted">Detectados: <b className="text-text">{numbers.length}</b> número(s).</p>
        </div>

        <div className="rounded-xl border border-border bg-bg/50 p-3">
          <p className="mb-2 text-sm font-medium text-text">Asignar a un asesor</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-64">
              <Select
                label="Asesor"
                value={asesorId}
                onChange={setAsesorId}
                placeholder="Selecciona"
                options={asesores.map((a) => ({ value: a.user_id, label: userLabel(a) }))}
              />
            </div>
            <Button onClick={asignar} loading={loading} disabled={!asesorId || numbers.length === 0}>
              Asignar ({numbers.length})
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg/50 p-3">
          <p className="mb-2 text-sm font-medium text-text">Reingresar como nuevos (Sin gestión)</p>
          <Button variant="secondary" onClick={reingresar} loading={loading} disabled={numbers.length === 0}>
            Reingresar ({numbers.length})
          </Button>
          <p className="mt-1 text-xs text-text-muted">Vuelven a SIN_GESTIÓN, sin asesor y como nuevos. No toca los vendidos.</p>
        </div>

        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
