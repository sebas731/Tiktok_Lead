import type { SummaryCard } from '@/lib/dashboard/summary'

export function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
