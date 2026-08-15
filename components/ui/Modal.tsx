'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ModalSize = 'md' | 'lg' | 'xl'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
  size?: ModalSize
}

const SIZE: Record<ModalSize, string> = {
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

export function Modal({ open, onClose, title, children, actions, size = 'md' }: ModalProps) {
  // Se monta en un portal a document.body para que `position: fixed` sea
  // relativo al viewport (algún ancestro con transform lo rompería).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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

  if (!mounted) return null

  return createPortal(
    // El clic fuera NO cierra (evita perder datos del formulario); se cierra con ✕ o Cancelar.
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-dark/40 p-4 py-10 backdrop-blur-sm">
      <div className={`animate-soft-in my-auto w-full ${SIZE[size]} rounded-3xl bg-white shadow-soft-lg`}>
        <div className="flex items-center justify-between border-b border-gray-200/80 px-5 py-4">
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
    </div>,
    document.body,
  )
}
