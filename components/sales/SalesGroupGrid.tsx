'use client'

import { EmptyState } from '@/components/ui/EmptyState'
import { SALE_STATUS_LABELS } from '@/lib/constants/saleStatus'
import type { SaleRow } from '@/lib/types'

export type GroupVariant = 'campaign' | 'sede' | 'sala'

export type SaleGroup = {
  key: string
  title: string
  subtitle?: string
  members?: number
  sede?: string
  sales: SaleRow[]
}

const STATUS_COLOR: Record<string, string> = {
  EN_GESTION: '#f59e0b',
  INGRESADA: '#3b82f6',
  PENDIENTE_DE_INGRESO: '#6366f1',
  INSTALADA: '#10b981',
  NO_INSTALADO: '#f43f5e',
  RECHAZADO: '#ef4444',
  NO_INGRESADA: '#e11d48',
  PRE_RECHAZO: '#fb7185',
  OBSERVADO: '#a855f7',
  REINGRESADO: '#0ea5e9',
  REASIGNACION: '#14b8a6',
  REMEDY: '#8b5cf6',
}
const DEFAULT_COLOR = '#94a3b8'

const VARIANT_META: Record<GroupVariant, { icon: string; kicker: string }> = {
  campaign: { icon: '🎯', kicker: 'Campaña' },
  sede: { icon: '🏢', kicker: 'Sede' },
  sala: { icon: '👥', kicker: 'Sala' },
}

function statusCounts(sales: SaleRow[]): [string, number][] {
  const m = new Map<string, number>()
  for (const s of sales) m.set(s.reason, (m.get(s.reason) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** Ilustración de edificio (decoración lateral de las tarjetas de sede). */
function BuildingArt() {
  return (
    <svg viewBox="0 0 48 96" fill="none" className="h-full w-full" aria-hidden>
      <rect x="8" y="20" width="32" height="72" rx="2" fill="rgba(255,255,255,0.18)" />
      <rect x="8" y="20" width="32" height="72" rx="2" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
      {[26, 40, 54, 68, 80].map((y) =>
        [13, 22, 31].map((x) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="5" height="7" rx="1" fill="rgba(255,255,255,0.85)" />
        )),
      )}
      <rect x="21" y="84" width="6" height="8" fill="rgba(255,255,255,0.9)" />
      <path d="M8 20l16-10 16 10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="rgba(255,255,255,0.12)" />
    </svg>
  )
}

function SedeCard({ g, onOpen }: { g: SaleGroup; onOpen: (g: SaleGroup) => void }) {
  const counts = statusCounts(g.sales)
  const total = g.sales.length
  return (
    <button
      type="button"
      onClick={() => onOpen(g)}
      className="group flex overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-red/40 hover:shadow-md"
    >
      {/* Decoración lateral izquierda: edificio */}
      <div className="flex w-20 shrink-0 items-end justify-center bg-gradient-to-b from-brand-red to-[#8a1620] p-2">
        <BuildingArt />
      </div>
      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Sede</p>
          <p className="truncate text-base font-semibold text-text">{g.title}</p>
          {g.subtitle && <p className="truncate text-xs text-text-muted">{g.subtitle}</p>}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold leading-none text-text">{total}</p>
            <p className="text-xs text-text-muted">venta{total === 1 ? '' : 's'}</p>
          </div>
          <span className="rounded-full bg-brand-red/10 px-2.5 py-1 text-xs font-medium text-brand-red opacity-0 transition group-hover:opacity-100">
            Ver tabla →
          </span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-border">
          {counts.map(([st, n]) => (
            <div
              key={st}
              style={{ width: `${(n / total) * 100}%`, background: STATUS_COLOR[st] ?? DEFAULT_COLOR }}
              title={`${SALE_STATUS_LABELS[st] ?? st}: ${n}`}
            />
          ))}
        </div>
      </div>
    </button>
  )
}

function GroupCard({ g, variant, onOpen }: { g: SaleGroup; variant: GroupVariant; onOpen: (g: SaleGroup) => void }) {
  const counts = statusCounts(g.sales)
  const total = g.sales.length
  const isSala = variant === 'sala'
  const meta = VARIANT_META[variant]

  return (
    <button
      type="button"
      onClick={() => onOpen(g)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-red/40 hover:shadow-md"
    >
      <div
        className={
          isSala
            ? 'flex items-center gap-3 bg-gradient-to-br from-brand-red to-[#8a1620] p-4 text-white'
            : 'flex items-center gap-3 border-b border-border bg-bg/40 p-4'
        }
      >
        <div
          className={
            isSala
              ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white'
              : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-lg'
          }
        >
          {isSala ? initials(g.subtitle ?? g.title) : meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className={isSala ? 'text-[11px] uppercase tracking-wide text-white/70' : 'text-[11px] uppercase tracking-wide text-text-muted'}>
            {meta.kicker}
          </p>
          <p className={isSala ? 'truncate font-semibold text-white' : 'truncate font-semibold text-text'}>{g.title}</p>
          {g.subtitle && (
            <p className={isSala ? 'truncate text-xs text-white/80' : 'truncate text-xs text-text-muted'}>
              {g.subtitle}
              {typeof g.members === 'number' ? ` · ${g.members} asesor${g.members === 1 ? '' : 'es'}` : ''}
            </p>
          )}
          {isSala && g.sede && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
              🏢 {g.sede}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold leading-none text-text">{total}</p>
            <p className="text-xs text-text-muted">venta{total === 1 ? '' : 's'}</p>
          </div>
          <span className="rounded-full bg-brand-red/10 px-2.5 py-1 text-xs font-medium text-brand-red opacity-0 transition group-hover:opacity-100">
            Ver detalle →
          </span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-border">
          {counts.map(([st, n]) => (
            <div
              key={st}
              style={{ width: `${(n / total) * 100}%`, background: STATUS_COLOR[st] ?? DEFAULT_COLOR }}
              title={`${SALE_STATUS_LABELS[st] ?? st}: ${n}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {counts.slice(0, 3).map(([st, n]) => (
            <span
              key={st}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg/50 px-2 py-0.5 text-[11px] text-text"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[st] ?? DEFAULT_COLOR }} />
              {SALE_STATUS_LABELS[st] ?? st}
              <span className="font-semibold">{n}</span>
            </span>
          ))}
          {counts.length > 3 && <span className="self-center text-[11px] text-text-muted">+{counts.length - 3}</span>}
        </div>
      </div>
    </button>
  )
}

export function SalesGroupGrid({
  groups,
  variant,
  onOpen,
}: {
  groups: SaleGroup[]
  variant: GroupVariant
  onOpen: (g: SaleGroup) => void
}) {
  if (groups.length === 0) {
    return <EmptyState title="Sin ventas" description="No hay ventas para agrupar con los filtros actuales." />
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) =>
        variant === 'sede' ? (
          <SedeCard key={g.key} g={g} onOpen={onOpen} />
        ) : (
          <GroupCard key={g.key} g={g} variant={variant} onOpen={onOpen} />
        ),
      )}
    </div>
  )
}
