'use client'

import { useState } from 'react'

/** Ícono "?" que muestra una explicación breve al pasar el mouse o al hacer clic. */
export function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        aria-label="Ayuda"
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] font-bold text-text-muted transition hover:bg-bg hover:text-text"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-1/2 top-6 z-30 w-60 -translate-x-1/2 rounded-lg border border-border bg-surface p-2.5 text-xs font-normal normal-case tracking-normal text-text shadow-lg">
          {text}
        </span>
      )}
    </span>
  )
}
