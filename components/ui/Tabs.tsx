'use client'

export type Tab = { id: string; label: string }

type TabsProps = {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'border-brand-red text-text'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
