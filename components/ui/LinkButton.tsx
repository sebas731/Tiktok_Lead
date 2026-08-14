import Link from 'next/link'
import type { ReactNode } from 'react'

type Variant = 'secondary' | 'ghost'

const BASE = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150'
const VARIANTS: Record<Variant, string> = {
  secondary: 'border border-border bg-surface text-text shadow-soft hover:bg-bg hover:-translate-y-0.5 active:translate-y-0',
  ghost: 'text-text hover:bg-black/5',
}

/** Un enlace de navegación con forma de botón (mismo estilo que <Button>). */
export function LinkButton({
  href,
  children,
  variant = 'secondary',
}: {
  href: string
  children: ReactNode
  variant?: Variant
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANTS[variant]}`}>
      {children}
    </Link>
  )
}
