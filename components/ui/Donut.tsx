export type DonutSegment = { label: string; value: number; color: string }

/** Gráfica de dona en SVG puro (sin librerías). Muestra el total en el centro. */
export function Donut({
  segments,
  size = 220,
  thickness = 30,
}: {
  segments: DonutSegment[]
  size?: number
  thickness?: number
}) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  const r = (size - thickness) / 2
  const circ = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
        <circle r={r} fill="none" stroke="var(--color-border)" strokeWidth={thickness} />
        {total > 0 &&
          segments.map((s, i) => {
            const dash = (s.value / total) * circ
            const el = (
              <circle
                key={i}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += dash
            return el
          })}
      </g>
      <text x={size / 2} y={size / 2 - 8} textAnchor="middle" style={{ fill: 'var(--color-text)' }} fontSize="26" fontWeight="700">
        {total}
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" style={{ fill: 'var(--color-text-muted)' }} fontSize="12">
        gestiones
      </text>
    </svg>
  )
}
