'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Select, type SelectOption } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { apiGet, apiSend } from '@/lib/api/client'
import { SALE_SECTIONS, CLIENT_FIELD_NAMES } from '@/lib/constants/saleForm'
import { fullName, type Me, type SaleRow } from '@/lib/types'
import { SaleFieldInput } from './SaleFieldInput'

type SaleFull = { id_sale: string; client: Record<string, unknown>; installation?: Record<string, unknown> | null } & Record<string, unknown>

const TIME_OPTIONS: SelectOption[] = [
  { value: '9:00 AM - 1:00 PM', label: '9:00 a.m. – 1:00 p.m.' },
  { value: '2:00 PM - 6:00 PM', label: '2:00 p.m. – 6:00 p.m.' },
]

function asStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10)
  return String(v)
}

const saleFieldsOf = (title: string) =>
  (SALE_SECTIONS.find((s) => s.title === title)?.fields ?? []).filter((f) => !CLIENT_FIELD_NAMES.has(f.name))
const clientFields = SALE_SECTIONS.flatMap((s) => s.fields).filter((f) => CLIENT_FIELD_NAMES.has(f.name))

const GENERAL_SECTIONS = ['Datos del contacto', 'Producto', 'Complementarios', 'Back office']

type Props = { sale: SaleRow; onClose: () => void; onSaved: () => void }

export function SaleGlassEditModal({ sale, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [prog, setProg] = useState<{ installation_date: string; installation_time: string; coments: string }>({
    installation_date: '',
    installation_time: '',
    coments: '',
  })
  const [supervisores, setSupervisores] = useState<SelectOption[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    apiGet<Me[]>('/api/users?role=SUPERVISOR')
      .then((u) => setSupervisores(u.map((s) => ({ value: s.user_id, label: fullName(s) }))))
      .catch(() => {})
    apiGet<SaleFull>(`/api/sales/${sale.id_sale}`)
      .then((d) => {
        const init: Record<string, string> = {}
        for (const section of SALE_SECTIONS) {
          for (const f of section.fields) {
            const raw = CLIENT_FIELD_NAMES.has(f.name) ? d.client?.[f.name] : d[f.name]
            init[f.name] = asStr(raw)
          }
        }
        setValues(init)
        setProg({
          installation_date: asStr(d.installation?.installation_date),
          installation_time: asStr(d.installation?.installation_time),
          coments: asStr(d.installation?.coments),
        })
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [sale.id_sale])

  const set = (k: string) => (v: string) => setValues((s) => ({ ...s, [k]: v }))
  const setMany = (patch: Record<string, string>) => setValues((s) => ({ ...s, ...patch }))

  async function save() {
    setSaving(true)
    setError('')
    try {
      await apiSend(`/api/sales/${sale.id_sale}`, 'PATCH', {
        ...values,
        pack_price: values.pack_price ? Number(values.pack_price) : undefined,
        total_price: values.total_price ? Number(values.total_price) : undefined,
        consolidado: values.consolidado ? Number(values.consolidado) : undefined,
      })
      // Programación (solo si hay algún dato)
      if (prog.installation_date || prog.installation_time || prog.coments) {
        await apiSend(`/api/sales/${sale.id_sale}/installation`, 'POST', {
          installation_date: prog.installation_date || null,
          installation_time: prog.installation_time || null,
          coments: prog.coments || null,
        })
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#3f0a0f]/55 p-4 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-soft-in my-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-white/25 bg-gradient-to-br from-[#a61c28]/90 to-[#6e0f16]/92 text-white shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-white/20 bg-white/5 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Editar venta</h2>
            <p className="text-xs text-white/70">{sale.code}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-white/70 transition hover:text-white">
            ✕
          </button>
        </div>

        <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="py-10 text-center text-white/80">Cargando…</p>
          ) : (
            <>
              {/* Datos generales de la venta */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/80">Datos generales de la venta</h3>
                <div className="rounded-2xl bg-white/95 p-4 text-text shadow-inner">
                  {GENERAL_SECTIONS.map((title) => {
                    const fields = saleFieldsOf(title)
                    if (fields.length === 0) return null
                    return (
                      <div key={title} className="mb-4 last:mb-0">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{title}</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {fields.map((f) => (
                            <SaleFieldInput
                              key={f.name}
                              field={f}
                              value={values[f.name] ?? ''}
                              onChange={set(f.name)}
                              supervisores={supervisores}
                              values={values}
                              setMany={setMany}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Datos del cliente */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/80">Datos del cliente</h3>
                <div className="rounded-2xl bg-white/95 p-4 text-text shadow-inner">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {clientFields.map((f) => (
                      <SaleFieldInput
                        key={f.name}
                        field={f}
                        value={values[f.name] ?? ''}
                        onChange={set(f.name)}
                        supervisores={supervisores}
                        values={values}
                        setMany={setMany}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Datos de programación */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/80">Datos de programación</h3>
                <div className="rounded-2xl bg-white/95 p-4 text-text shadow-inner">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <DatePicker
                      label="Fecha de instalación"
                      value={prog.installation_date}
                      onChange={(v) => setProg((p) => ({ ...p, installation_date: v }))}
                    />
                    <Select
                      label="Rango horario"
                      value={prog.installation_time}
                      onChange={(v) => setProg((p) => ({ ...p, installation_time: v }))}
                      options={TIME_OPTIONS}
                      placeholder="Selecciona"
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text">Comentarios</label>
                      <textarea
                        value={prog.coments}
                        onChange={(e) => setProg((p) => ({ ...p, coments: e.target.value }))}
                        rows={2}
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-red"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {error && <p className="text-sm font-medium text-white">{error}</p>}
            </>
          )}
        </div>

        {/* Pie */}
        <div className="flex justify-end gap-2 border-t border-white/20 bg-white/5 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-red shadow transition hover:bg-white/90 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
