import type { SelectOption } from '@/components/ui/Select'

// Etiquetas legibles de cada status.
export const STATUS_LABELS: Record<string, string> = {
  SIN_GESTION: 'Sin gestión',
  AGENDADO: 'Agendado',
  POSITIVO: 'Positivo',
  NEGATIVO: 'Negativo',
  NO_CONTACTO: 'No contacto',
}

export const SUBSTATUS_LABELS: Record<string, string> = {
  OTRO: 'Otro',
  VENTA: 'Venta',
  CLIENTE_NO_SOLICITO_INFORMACION: 'No solicitó información',
  NO_TIENE_COBERTURA: 'No tiene cobertura',
  LO_PENSARA: 'Lo pensará',
  LLAMAR_MAS_TARDE: 'Llamar más tarde',
  CELULAR_APAGADO: 'Celular apagado',
  NO_CONTESTA: 'No contesta',
}

// Sub-status permitidos según el status elegido (siempre incluye OTRO).
export const SUBSTATUS_BY_STATUS: Record<string, string[]> = {
  SIN_GESTION: ['OTRO'],
  POSITIVO: ['VENTA', 'OTRO'],
  NEGATIVO: ['CLIENTE_NO_SOLICITO_INFORMACION', 'NO_TIENE_COBERTURA', 'OTRO'],
  AGENDADO: ['LO_PENSARA', 'LLAMAR_MAS_TARDE', 'OTRO'],
  NO_CONTACTO: ['CELULAR_APAGADO', 'NO_CONTESTA', 'OTRO'],
}

const toOptions = (values: string[], labels: Record<string, string>): SelectOption[] =>
  values.map((v) => ({ value: v, label: labels[v] ?? v }))

export const STATUS_OPTIONS: SelectOption[] = toOptions(Object.keys(STATUS_LABELS), STATUS_LABELS)

export function substatusOptions(status: string): SelectOption[] {
  return toOptions(SUBSTATUS_BY_STATUS[status] ?? ['OTRO'], SUBSTATUS_LABELS)
}

export const DOC_TYPE_OPTIONS: SelectOption[] = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'Carné de extranjería' },
  { value: 'PASSAPORTE', label: 'Pasaporte' },
  { value: 'RUC', label: 'RUC' },
]

// Definición de los campos del formulario de venta (LeadSaleDetail).
export type SaleField = {
  name: string
  label: string
  kind: 'text' | 'number' | 'select'
  options?: SelectOption[]
  optional?: boolean
}

export const SALE_FIELDS: SaleField[] = [
  { name: 'agenteNombre', label: 'Nombre de agente', kind: 'text' },
  { name: 'supervisorNombre', label: 'Nombre de supervisor', kind: 'text' },
  { name: 'canalVenta', label: 'Canal de venta', kind: 'text' },
  { name: 'titularNombre', label: 'Nombre del titular', kind: 'text' },
  { name: 'contactoNombre', label: 'Nombre de contacto', kind: 'text' },
  { name: 'parentesco', label: 'Parentesco', kind: 'text' },
  { name: 'nombrePadres', label: 'Nombre de padres', kind: 'text', optional: true },
  { name: 'tipoDocumento', label: 'Tipo de documento', kind: 'select', options: DOC_TYPE_OPTIONS },
  { name: 'numeroDocumento', label: 'N° de documento', kind: 'text' },
  { name: 'numeroGrabacion', label: 'N° de grabación', kind: 'text', optional: true },
  { name: 'numeroLlamadas', label: 'N° de llamadas', kind: 'number' },
]
