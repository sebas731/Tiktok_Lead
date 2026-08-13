type DatePickerProps = {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

// Misma API que Input; usa el date picker nativo. El valor es 'YYYY-MM-DD'.
export function DatePicker({ label, value, onChange, error, disabled = false }: DatePickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          rounded-lg border px-3 py-2 text-sm outline-none transition
          disabled:bg-gray-50 disabled:text-gray-400
          ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-brand-red'}
        `}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
