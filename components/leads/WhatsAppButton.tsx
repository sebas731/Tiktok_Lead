'use client'

import { toLocalDigits, waChatUrl, waGreeting } from '@/lib/leads/phone'

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M17.5 14.4c-.3-.15-1.7-.84-1.96-.94-.26-.1-.45-.15-.64.15-.19.29-.74.94-.9 1.13-.17.19-.33.21-.61.07-.3-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.73-1.63-2.02-.17-.29-.02-.45.13-.6.13-.13.29-.33.44-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.19 2.01 3.06 4.86 4.29.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.12.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34z" />
      <path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.15l-.3-.18-3 .94.95-2.92-.2-.31A8.2 8.2 0 1112 20.2z" />
    </svg>
  )
}

/**
 * Botón de WhatsApp con el saludo prellenado. Usa un target NOMBRADO ("whatsapp"):
 * si ya hay una ventana de WhatsApp abierta con ese nombre, la reutiliza (escribe
 * ahí); si no existe, recién abre una nueva.
 */
export function WhatsAppButton({ leadNumber, asesorName }: { leadNumber: string; asesorName: string }) {
  const href = waChatUrl(leadNumber, waGreeting(asesorName, toLocalDigits(leadNumber)))
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        // Reutiliza la ventana de WhatsApp (target nombrado); si no existe, abre una.
        window.open(href, 'whatsapp')
      }}
      title="Abrir en WhatsApp"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition hover:bg-emerald-50"
    >
      <WhatsAppIcon />
    </a>
  )
}
