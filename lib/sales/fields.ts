import { Prisma, DocumentType } from '@/lib/generated/prisma/client'
import { requireString } from '@/lib/api/response'

type FieldKind = 'str' | 'num' | 'int' | 'date'
type FieldSpec = { key: string; kind: FieldKind }

// Campos de Client (además de los obligatorios document_number/titular_name/last_names)
const CLIENT_OPTIONAL: FieldSpec[] = [
  { key: 'contacto_name', kind: 'str' },
  { key: 'parentesco', kind: 'str' },
  { key: 'fathers_name', kind: 'str' },
  { key: 'number_calls', kind: 'str' },
  { key: 'number_whatsapp', kind: 'str' },
  { key: 'operator_client', kind: 'str' },
  { key: 'birth_date', kind: 'date' },
  { key: 'birth_place', kind: 'str' },
  { key: 'gender', kind: 'str' },
  { key: 'department', kind: 'str' },
  { key: 'province', kind: 'str' },
  { key: 'district', kind: 'str' },
  { key: 'address', kind: 'str' },
  { key: 'reference_address', kind: 'str' },
  { key: 'nodo', kind: 'str' },
  { key: 'email', kind: 'str' },
  { key: 'ubigeo', kind: 'str' },
]

// Campos de Sale que llena el ASESOR (varios son enums; se envía el NOMBRE del enum)
export const SALE_ADVISOR_FIELDS: FieldSpec[] = [
  { key: 'sale_channel', kind: 'str' },
  { key: 'number_record', kind: 'str' },
  { key: 'product_play', kind: 'str' },
  { key: 'product', kind: 'str' },
  { key: 'network_plan', kind: 'str' },
  { key: 'tv_plan', kind: 'str' },
  { key: 'phone_plan', kind: 'str' },
  { key: 'type_sale', kind: 'str' },
  { key: 'pack_price', kind: 'num' },
  { key: 'repeater', kind: 'str' },
  { key: 'deco1', kind: 'str' },
  { key: 'deco2', kind: 'str' },
  { key: 'premium_pack', kind: 'str' },
  { key: 'total_price', kind: 'num' },
  { key: 'observations', kind: 'str' },
  { key: 'equifax_document', kind: 'str' },
  { key: 'record_validation', kind: 'str' },
  { key: 'full_claro', kind: 'str' },
  { key: 'region', kind: 'str' },
  { key: 'client_pay', kind: 'str' },
  { key: 'operation_type', kind: 'str' },
  { key: 'address_type', kind: 'str' },
  { key: 'high_value', kind: 'str' },
  { key: 'consolidado', kind: 'int' },
]

// Campos de Sale exclusivos del BACK
export const SALE_BACK_FIELDS: FieldSpec[] = [
  { key: 'sec', kind: 'str' },
  { key: 'sot', kind: 'str' },
  { key: 'ugis', kind: 'str' },
  { key: 'contrata_inst', kind: 'str' },
  { key: 'codigo_cliente_pago', kind: 'str' },
]

function coerce(kind: FieldKind, v: unknown): string | number | Date | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  if (kind === 'num') return typeof v === 'number' ? v : Number(v)
  if (kind === 'int') return typeof v === 'number' ? Math.trunc(v) : parseInt(String(v), 10)
  if (kind === 'date') return new Date(String(v))
  return String(v)
}

/** Copia solo los campos permitidos presentes en input, con coerción de tipo. */
export function pickFields(input: Record<string, unknown>, specs: FieldSpec[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const { key, kind } of specs) {
    if (Object.prototype.hasOwnProperty.call(input, key)) out[key] = coerce(kind, input[key])
  }
  return out
}

/** Datos de Client para crear (valida obligatorios). */
export function buildClientCreate(input: Record<string, unknown>): Prisma.ClientCreateInput {
  const base = {
    document_type: (typeof input.document_type === 'string' && (Object.values(DocumentType) as string[]).includes(input.document_type)
      ? input.document_type
      : DocumentType.DNI) as DocumentType,
    document_number: requireString(input.document_number, 'document_number'),
    titular_name: requireString(input.titular_name, 'titular_name'),
    last_names: requireString(input.last_names, 'last_names'),
    ...pickFields(input, CLIENT_OPTIONAL),
  }
  return base as Prisma.ClientCreateInput
}

/** Datos de Client para actualizar (solo lo presente). */
export function buildClientUpdate(input: Record<string, unknown>): Prisma.ClientUpdateInput {
  const out: Record<string, unknown> = pickFields(input, CLIENT_OPTIONAL)
  if (typeof input.document_number === 'string') out.document_number = input.document_number
  if (typeof input.titular_name === 'string') out.titular_name = input.titular_name
  if (typeof input.last_names === 'string') out.last_names = input.last_names
  if (typeof input.document_type === 'string' && (Object.values(DocumentType) as string[]).includes(input.document_type)) {
    out.document_type = input.document_type
  }
  return out as Prisma.ClientUpdateInput
}
