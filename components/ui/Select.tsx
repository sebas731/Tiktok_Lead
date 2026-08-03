export type SelectOption = {
  value: string
  label: string
}

type SelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  error?: string
  disabled?: boolean
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled = false,
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          rounded-lg border bg-white px-3 py-2 text-sm outline-none transition
          disabled:bg-gray-50 disabled:text-gray-400
          ${error
            ? 'border-red-400 focus:border-red-500'
            : 'border-gray-300 focus:border-gray-900'
          }
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
