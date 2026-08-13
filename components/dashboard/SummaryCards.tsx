import type { SummaryCard } from '@/lib/dashboard/summary'

// Acentos rotativos (marca CK2 + tonos de estado) para dar color sin saturar.
const ACCENTS = [
  { bar: 'bg-brand-red', dot: 'bg-brand-red/10 text-brand-red', ring: 'ring-brand-red/20' },
  { bar: 'bg-status-singestion', dot: 'bg-status-singestion-bg text-status-singestion', ring: 'ring-status-singestion/20' },
  { bar: 'bg-status-positivo', dot: 'bg-status-positivo-bg text-status-positivo', ring: 'ring-status-positivo/20' },
  { bar: 'bg-status-agendado', dot: 'bg-status-agendado-bg text-status-agendado', ring: 'ring-status-agendado/20' },
]

export function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, i) => {
        const a = ACCENTS[i % ACCENTS.length]
        return (
          <div
            key={card.label}
            className={`animate-soft-in relative overflow-hidden rounded-3xl border border-border/70 bg-surface p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg ring-1 ${a.ring}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className={`absolute inset-y-4 left-0 w-1.5 rounded-full ${a.bar}`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">{card.label}</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-text">{card.value}</p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${a.dot}`}>
                {card.label.charAt(0)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
