import type { SelectOption } from '@/components/ui/Select'
import * as E from '@/lib/constants/saleEnums'

export type SaleFieldKind =
  | 'text'
  | 'num'
  | 'date'
  | 'enum'
  | 'supervisor'
  | 'parentesco'
  | 'doctype'
  | 'file'
  | 'department'
  | 'province'
  | 'district'

export type SaleField = {
  name: string
  label: string
  kind: SaleFieldKind
  options?: SelectOption[]
  scope: 'advisor' | 'back'
}

export type SaleSection = { title: string; fields: SaleField[] }

const adv = (name: string, label: string, kind: SaleFieldKind, options?: SelectOption[]): SaleField => ({
  name, label, kind, options, scope: 'advisor',
})
const back = (name: string, label: string, kind: SaleFieldKind, options?: SelectOption[]): SaleField => ({
  name, label, kind, options, scope: 'back',
})

export const SALE_SECTIONS: SaleSection[] = [
  {
    title: 'Datos del contacto',
    fields: [
      adv('managerAdvisorId', 'Supervisor', 'supervisor'),
      adv('sale_channel', 'Canal de venta', 'enum', E.SALE_CHANNEL),
      adv('titular_name', 'Titular (nombres)', 'text'),
      adv('last_names', 'Apellidos', 'text'),
      adv('contacto_name', 'Contacto (nombres y apellidos)', 'text'),
      adv('parentesco', 'Parentesco', 'parentesco'),
      adv('fathers_name', 'Nombre de padres', 'text'),
      adv('document_type', 'Tipo DOC.', 'doctype'),
      adv('document_number', 'N° Documento', 'text'),
      adv('number_calls', 'N° Llamadas (técnico)', 'text'),
      adv('number_whatsapp', 'N° WhatsApp', 'text'),
      adv('operator_client', 'Operadora', 'enum', E.OPERATOR),
      adv('number_record', 'N° Grabación', 'text'),
    ],
  },
  {
    title: 'Datos personales',
    fields: [
      adv('birth_date', 'Fecha de nacimiento', 'date'),
      adv('email', 'Email', 'text'),
      adv('birth_place', 'Lugar de nacimiento', 'text'),
      adv('gender', 'Género', 'enum', E.GENDER),
      adv('department', 'Departamento', 'department'),
      adv('province', 'Provincia', 'province'),
      adv('district', 'Distrito', 'district'),
      adv('address', 'Dirección', 'text'),
      adv('reference_address', 'Referencia de dirección', 'text'),
      adv('nodo', 'Nodo', 'text'),
    ],
  },
  {
    title: 'Producto',
    fields: [
      adv('product_play', 'Producto (Play)', 'enum', E.PRODUCT_PLAY),
      adv('product', 'Producto', 'enum', E.PRODUCT),
      adv('phone_plan', 'Plan teléfono', 'enum', E.PLAIN_PHONE),
      adv('network_plan', 'Plan internet', 'enum', E.NETWORK_PLAN),
      adv('tv_plan', 'Plan cable', 'enum', E.TV_PLAN),
      adv('type_sale', 'Tipo de venta', 'enum', E.TYPE_SALE),
      adv('pack_price', 'Precio paquete', 'num'),
      adv('repeater', 'Repetidor (mesh)', 'enum', E.REPETIDOR),
      adv('deco1', 'Decos adicionales 1', 'enum', E.OPCION_DECO1),
      adv('deco2', 'Decos adicionales 2', 'enum', E.OPCION_DECO2),
      adv('premium_pack', 'Paquetes premium', 'enum', E.PREMIUM_PACKS),
      adv('total_price', 'Precio total', 'num'),
      adv('address_type', 'Tipo de domicilio', 'enum', E.BUILD_TYPE),
      adv('high_value', 'Alto valor', 'enum', E.HIGH_VALUE),
      adv('observations', 'Observaciones', 'text'),
    ],
  },
  {
    title: 'Complementarios',
    fields: [
      adv('record_validation', 'Validación de audio', 'enum', E.RECORD_VALIDATION),
      adv('full_claro', 'Full Claro', 'enum', E.FULL_CLARO),
      adv('region', 'Región', 'enum', E.REGION),
      adv('client_pay', 'Cliente de pago', 'enum', E.CLIENT_PAY),
      adv('operation_type', 'Tipo operación', 'enum', E.OPERATION_TYPE),
      adv('consolidado', 'Consolidado (1-10)', 'num'),
      adv('equifax_document', 'Documento EQUIFAX', 'file'),
    ],
  },
  {
    title: 'Back office',
    fields: [
      back('sec', 'SEC', 'text'),
      back('sot', 'SOT', 'text'),
      back('ugis', 'UGIS', 'text'),
      back('contrata_inst', 'Contrata inst.', 'text'),
      back('codigo_cliente_pago', 'Código cliente (pago)', 'text'),
    ],
  },
]

/** Nombres de campos que pertenecen al Client (el resto van a Sale). */
export const CLIENT_FIELD_NAMES = new Set([
  'titular_name', 'last_names', 'contacto_name', 'parentesco', 'fathers_name',
  'document_type', 'document_number', 'number_calls', 'number_whatsapp',
  'operator_client', 'birth_date', 'birth_place', 'gender', 'department',
  'province', 'district', 'address', 'reference_address', 'nodo', 'email',
])

/** Valores por defecto (primer enum) para que los combos siempre envíen un valor. */
export function defaultSaleValues(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const section of SALE_SECTIONS) {
    for (const f of section.fields) {
      if (f.kind === 'enum' && f.options && f.options.length > 0) out[f.name] = f.options[0].value
    }
  }
  return out
}
