import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

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
  primary: 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400',
  secondary: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:text-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300',
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
        inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2
        text-sm font-medium transition
        disabled:cursor-not-allowed
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
