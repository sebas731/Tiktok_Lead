import type { ReactNode } from 'react'

export type BadgeTone =
  | 'neutral'
  | 'positivo'
  | 'negativo'
  | 'agendado'
  | 'nocontacto'
  | 'singestion'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-text-muted',
  positivo: 'bg-status-positivo-bg text-status-positivo',
  negativo: 'bg-status-negativo-bg text-status-negativo',
  agendado: 'bg-status-agendado-bg text-status-agendado',
  nocontacto: 'bg-status-nocontacto-bg text-status-nocontacto',
  singestion: 'bg-status-singestion-bg text-status-singestion',
}

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}

// Color por cada status de LEAD_STATUS.
export const LEAD_STATUS_TONE: Record<string, BadgeTone> = {
  POSITIVO: 'positivo',
  NEGATIVO: 'negativo',
  AGENDADO: 'agendado',
  NO_CONTACTO: 'nocontacto',
  SIN_GESTION: 'singestion',
}

export function leadStatusTone(status: string): BadgeTone {
  return LEAD_STATUS_TONE[status] ?? 'neutral'
}
