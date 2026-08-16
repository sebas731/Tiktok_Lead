'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

/** Explicación animada (con dibujos) de cómo recuperar los últimos 5 leads gestionados. */
export function RecoverHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="¿Cómo recuperar un lead?" actions={<Button onClick={onClose}>Entendido</Button>}>
      <style>{`
        @keyframes rh-slide { 0%,15% { transform: translateX(0); } 55%,100% { transform: translateX(120px); } }
        @keyframes rh-arrow { 0%,15% { opacity: 0; } 40% { opacity: 1; } 70%,100% { opacity: 0; } }
        @keyframes rh-pop { 0%,55% { transform: scale(.6); opacity: 0; } 75%,100% { transform: scale(1); opacity: 1; } }
        @keyframes rh-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .rh-card { animation: rh-slide 3.2s ease-in-out infinite; }
        .rh-arrow { animation: rh-arrow 3.2s ease-in-out infinite; }
        .rh-pop { animation: rh-pop 3.2s ease-in-out infinite; }
        .rh-float { animation: rh-float 2s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col gap-5">
        {/* Dibujo animado (SVG, sin emojis) */}
        <div className="relative flex h-28 items-center justify-between rounded-2xl border border-border bg-bg/40 px-6">
          <div className="rh-float flex flex-col items-center gap-1 text-text-muted">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] font-medium">Historial</span>
          </div>

          <svg className="rh-arrow absolute left-1/2 top-1/2 h-6 w-20 -translate-x-1/2 -translate-y-1/2 text-brand-red" viewBox="0 0 80 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 12h60" strokeLinecap="round" />
            <path d="m54 4 12 8-12 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div className="rh-card absolute left-8 rounded-lg border border-brand-red/40 bg-surface px-3 py-2 text-xs font-medium text-text shadow-sm">
            Lead
          </div>

          <div className="rh-pop flex flex-col items-center gap-1 text-emerald-600">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 12h4l2 3h6l2-3h4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 12V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] font-medium">Por atender</span>
          </div>
        </div>

        {/* Pasos */}
        <ol className="flex flex-col gap-2.5 text-sm text-text">
          <li className="flex gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-xs font-bold text-brand-red">1</span>
            <span>En tu <b>Historial</b>, solo tus <b>5 leads más recientes</b> se pueden recuperar (las 5 primeras filas).</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-xs font-bold text-brand-red">2</span>
            <span>Haz <b>clic en la fila</b> del lead que quieres corregir para abrir su ventana.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-xs font-bold text-brand-red">3</span>
            <span>Cambia la tipificación y <b>guarda</b>: el lead vuelve a «Por atender» y se resalta en verde.</span>
          </li>
        </ol>
      </div>
    </Modal>
  )
}
