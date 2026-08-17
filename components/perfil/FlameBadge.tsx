'use client'

type Variant = 'red' | 'purple'

const PALETTE: Record<Variant, { outer: string; mid: string; core: string; glow: string }> = {
  red: { outer: '#ef4444', mid: '#f97316', core: '#fde047', glow: 'rgba(249,115,22,.55)' },
  purple: { outer: '#7c3aed', mid: '#a855f7', core: '#e9d5ff', glow: 'rgba(168,85,247,.55)' },
}

/** Llama animada "viva" con el número de la racha. */
export function FlameBadge({ value, variant }: { value: number; variant: Variant }) {
  const c = PALETTE[variant]
  return (
    <div className="relative inline-flex h-28 w-24 items-center justify-center">
      <style>{`
        @keyframes flame-flicker {
          0%,100% { transform: scale(1,1) translateY(0) rotate(-1deg); }
          25% { transform: scale(1.05,.96) translateY(-2px) rotate(1deg); }
          50% { transform: scale(.96,1.06) translateY(1px) rotate(-1.5deg); }
          75% { transform: scale(1.04,.98) translateY(-1px) rotate(1.5deg); }
        }
        @keyframes flame-core {
          0%,100% { transform: scale(1) translateY(0); opacity: .95; }
          40% { transform: scale(.9) translateY(1px); opacity: 1; }
          70% { transform: scale(1.08) translateY(-1px); opacity: .9; }
        }
        @keyframes flame-glow { 0%,100% { opacity:.5; } 50% { opacity:.9; } }
        .fb-outer { transform-origin: 50% 90%; animation: flame-flicker 1.1s ease-in-out infinite; }
        .fb-core  { transform-origin: 50% 85%; animation: flame-core 0.9s ease-in-out infinite; }
        .fb-glow  { animation: flame-glow 1.3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .fb-outer, .fb-core, .fb-glow { animation: none; }
        }
      `}</style>

      {/* Resplandor detrás */}
      <span
        className="fb-glow absolute h-16 w-16 rounded-full blur-xl"
        style={{ background: c.glow }}
      />

      <svg viewBox="0 0 64 80" className="relative h-full w-full drop-shadow-sm">
        {/* Llama exterior */}
        <path
          className="fb-outer"
          fill={c.outer}
          d="M32 3c3 9 11 14 11 26 0 11.6-6.6 20-19 20S5 40.6 5 29c0-6.5 2.7-11 6.6-15 .7 4.6 3.6 6.6 6.3 5.6C21.4 18.4 22 12 20 6c6 2 9 6 12 12 .4-5-.4-9 0-15z"
          transform="translate(0 2)"
        />
        {/* Llama media */}
        <path
          className="fb-outer"
          fill={c.mid}
          style={{ animationDelay: '.15s' }}
          d="M32 20c2 6 7 9 7 17 0 7.7-4.4 13-12 13s-12-5.3-12-13c0-4.3 1.8-7.3 4.3-10 .5 3 2.4 4.3 4.1 3.7 1.6-.6 2-4.8.6-8.7z"
          transform="translate(0 6)"
        />
        {/* Núcleo */}
        <path
          className="fb-core"
          fill={c.core}
          d="M32 34c1.4 3.6 4 5.4 4 9.6 0 4.4-2.7 7.4-7 7.4s-7-3-7-7.4c0-2.7 1.2-4.5 2.7-6.1.3 1.8 1.4 2.5 2.4 2.1 1-.4 1.2-2.7.9-5.6z"
          transform="translate(0 8)"
        />
      </svg>

      {/* Número de la racha */}
      <span className="absolute bottom-1.5 text-2xl font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.45)]">
        {value}
      </span>
    </div>
  )
}
