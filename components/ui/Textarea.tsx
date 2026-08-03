type TextareaProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  rows?: number
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  rows = 3,
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          resize-y rounded-lg border px-3 py-2 text-sm outline-none transition
          disabled:bg-gray-50 disabled:text-gray-400
          ${error
            ? 'border-red-400 focus:border-red-500'
            : 'border-gray-300 focus:border-gray-900'
          }
        `}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
