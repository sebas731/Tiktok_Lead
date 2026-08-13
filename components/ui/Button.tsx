import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  className?: string
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-brand-red to-brand-red-dk text-white shadow-brand hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:shadow-none',
  secondary:
    'border border-border bg-surface text-text shadow-soft hover:bg-bg hover:-translate-y-0.5 active:translate-y-0 disabled:text-text-muted disabled:shadow-none',
  ghost: 'text-text hover:bg-black/5 disabled:text-text-muted',
  danger: 'bg-gradient-to-b from-red-600 to-red-800 text-white shadow-brand hover:brightness-105 disabled:opacity-50',
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2
        text-sm font-medium transition-all duration-150
        disabled:cursor-not-allowed disabled:hover:translate-y-0
        ${VARIANTS[variant]} ${className}
      `}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
