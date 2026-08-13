import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-border/70 bg-surface p-5 shadow-soft ${className}`}>{children}</div>
  )
}
