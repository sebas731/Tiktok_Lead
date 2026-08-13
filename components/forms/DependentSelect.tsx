'use client'

import { useEffect } from 'react'
import { Select, type SelectOption } from '@/components/ui/Select'

type DependentSelectProps = {
  label: string
  parentValue: string
  getOptions: (parentValue: string) => SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
}

/**
 * Select cuyas opciones dependen de otro valor (motivo→submotivo,
 * departamento→provincia→distrito). Si el valor actual deja de ser válido al
 * cambiar el padre, lo limpia automáticamente.
 */
export function DependentSelect({
  label,
  parentValue,
  getOptions,
  value,
  onChange,
  placeholder,
  error,
  disabled,
}: DependentSelectProps) {
  const options = getOptions(parentValue)

  useEffect(() => {
    if (value && !options.some((o) => o.value === value)) onChange('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentValue])

  return (
    <Select
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      error={error}
      disabled={disabled || options.length === 0}
    />
  )
}
