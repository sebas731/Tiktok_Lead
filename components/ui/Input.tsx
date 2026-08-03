type InputProps = {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          rounded-lg border px-3 py-2 text-sm outline-none transition
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