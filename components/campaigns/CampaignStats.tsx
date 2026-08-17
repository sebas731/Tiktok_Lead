export type Breakdown = {
  campaignId: string
  sinGestion: number
  noContacto: number
  agendado: number
  positivo: number
  positivoSinVenta: number
  negativo: number
  nuevos5min: number
  total: number
}

function Chip({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-2 py-1 ${tone}`}>
      <span className="text-[11px] font-medium">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  )
}

/** Desglose por estado de una campaña (se usa en la tarjeta y en el panel). */
export function CampaignStats({ b }: { b?: Breakdown }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-1.5">
      <Chip label="Sin gestión" value={b?.sinGestion ?? 0} tone="bg-amber-50 text-amber-700" />
      <Chip label="No contacto" value={b?.noContacto ?? 0} tone="bg-blue-50 text-blue-700" />
      <Chip label="Pos. sin venta" value={b?.positivoSinVenta ?? 0} tone="bg-emerald-50 text-emerald-700" />
      <Chip label="Negativos" value={b?.negativo ?? 0} tone="bg-rose-50 text-rose-700" />
    </div>
  )
}
