type IconProps = { className?: string }

// Íconos inline (stroke), sin dependencias externas.
const P = ({ d, className }: { d: string; className?: string }) => (
  <svg
    className={className ?? 'h-[18px] w-[18px]'}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
)

export const Icons: Record<string, (p: IconProps) => React.ReactElement> = {
  home: (p) => <P className={p.className} d="M3 11l9-8 9 8M5 10v10h14V10" />,
  campaigns: (p) => <P className={p.className} d="M3 11l18-5v12l-18-5v-2zM7 12v6a2 2 0 002 2" />,
  leads: (p) => <P className={p.className} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87" />,
  ventas: (p) => <P className={p.className} d="M4 4h16v4H4zM4 8v12h16V8M9 12h6" />,
  users: (p) => <P className={p.className} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  sedes: (p) => <P className={p.className} d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
  grupos: (p) => <P className={p.className} d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />,
  settings: (p) => <P className={p.className} d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-2.9 1.09V21a2 2 0 11-4 0v-.09A1.65 1.65 0 007 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 14 1.65 1.65 0 003 12.09V12a2 2 0 010-4h.09A1.65 1.65 0 004.6 6" />,
  keys: (p) => <P className={p.className} d="M15 7a4 4 0 11-4 4l-6 6v3h3l1-1v-2h2v-2h2l1.35-1.35A4 4 0 0015 7zM17.5 7.5h.01" />,
  reportes: (p) => <P className={p.className} d="M21 21H3V3M7 15l4-4 3 3 5-6" />,
}
