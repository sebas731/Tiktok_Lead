'use client'

import { useEffect, type ReactNode } from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
}

export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="mt-16 w-full max-w-lg rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-gray-400 transition hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {actions && (
          <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
