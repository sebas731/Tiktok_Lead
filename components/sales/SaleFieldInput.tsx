'use client'

import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { FileUpload } from '@/components/ui/FileUpload'
import { PARENTESCO } from '@/lib/constants/catalogos'
import { DEPARTMENTS, provincesOf, districtsOf } from '@/lib/constants/ubigeo'
import type { SaleField } from '@/lib/constants/saleForm'

const DOC_OPTIONS: SelectOption[] = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'C.E' },
  { value: 'PASSAPORTE', label: 'Pasaporte' },
  { value: 'RUC', label: 'RUC' },
]

const toOpts = (arr: string[]): SelectOption[] => arr.map((v) => ({ value: v, label: v }))

type Props = {
  field: SaleField
  value: string
  onChange: (value: string) => void
  supervisores: SelectOption[]
  /** Mapa completo de valores (necesario para la cascada ubigeo). */
  values?: Record<string, string>
  /** Aplica varios cambios a la vez (para resetear los hijos de la cascada). */
  setMany?: (patch: Record<string, string>) => void
}

export function SaleFieldInput({ field, value, onChange, supervisores, values, setMany }: Props) {
  switch (field.kind) {
    case 'supervisor':
      return <Select label={field.label} value={value} onChange={onChange} options={supervisores} placeholder="Selecciona" />
    case 'parentesco':
      return <Select label={field.label} value={value} onChange={onChange} options={toOpts(PARENTESCO)} placeholder="Selecciona" />
    case 'doctype':
      return <Select label={field.label} value={value} onChange={onChange} options={DOC_OPTIONS} placeholder="Selecciona" />
    case 'enum':
      return <Select label={field.label} value={value} onChange={onChange} options={field.options ?? []} placeholder="Selecciona" />
    case 'department':
      return (
        <Select
          label={field.label}
          value={value}
          onChange={(v) => (setMany ? setMany({ department: v, province: '', district: '' }) : onChange(v))}
          options={toOpts(DEPARTMENTS)}
          placeholder="Selecciona"
        />
      )
    case 'province': {
      const dep = values?.department ?? ''
      return (
        <Select
          label={field.label}
          value={value}
          onChange={(v) => (setMany ? setMany({ province: v, district: '' }) : onChange(v))}
          options={toOpts(provincesOf(dep))}
          placeholder={dep ? 'Selecciona' : 'Elige un departamento'}
        />
      )
    }
    case 'district': {
      const dep = values?.department ?? ''
      const prov = values?.province ?? ''
      return (
        <Select
          label={field.label}
          value={value}
          onChange={onChange}
          options={toOpts(districtsOf(dep, prov))}
          placeholder={prov ? 'Selecciona' : 'Elige una provincia'}
        />
      )
    }
    case 'date':
      return <DatePicker label={field.label} value={value} onChange={onChange} />
    case 'file':
      return <FileUpload label={field.label} value={value} onChange={(dataUrl) => onChange(dataUrl)} />
    case 'num':
      return <Input label={field.label} type="number" value={value} onChange={onChange} />
    default:
      return <Input label={field.label} value={value} onChange={onChange} />
  }
}
