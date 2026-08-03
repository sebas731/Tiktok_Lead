import type { ReactNode } from 'react'

export type BadgeTone = 'gray' | 'green' | 'red' | 'yellow' | 'blue'

const TONES: Record<BadgeTone, string> = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
}

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
}

export function Badge({ children, tone = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}

// Color e etiqueta legible por cada status de LEAD_STATUS.
export const LEAD_STATUS_TONE: Record<string, BadgeTone> = {
  POSITIVO: 'green',
  NEGATIVO: 'red',
  AGENDADO: 'yellow',
  NO_CONTACTO: 'gray',
  SIN_GESTION: 'blue',
}

export function leadStatusTone(status: string): BadgeTone {
  return LEAD_STATUS_TONE[status] ?? 'gray'
}
