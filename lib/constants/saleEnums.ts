import type { SelectOption } from '@/components/ui/Select'

/**
 * Opciones de los enums de venta para los combo box. El `value` es el NOMBRE
 * del enum (lo que espera Prisma); el `label` es el texto legible (del `@map`
 * o sin guiones bajos). Es un archivo client-safe (NO importa el cliente Prisma).
 */
const opt = (value: string, label: string): SelectOption => ({ value, label })

export const SALE_CHANNEL: SelectOption[] = [
  opt('BASE_DE_DATOS', 'BASE DE DATOS'),
  opt('RRSS_THOR', 'RRSS THOR'),
  opt('RECUPEROS', 'RECUPEROS'),
  opt('FACEBOOK', 'FACEBOOK'),
  opt('TIKTOK', 'TIKTOK'),
  opt('INSTAGRAM', 'INSTAGRAM'),
  opt('GOOGLE', 'GOOGLE'),
]

export const OPERATOR: SelectOption[] = [
  opt('MOVISTAR', 'MOVISTAR'), opt('CLARO', 'CLARO'), opt('ENTEL', 'ENTEL'), opt('BITEL', 'BITEL'),
]

export const GENDER: SelectOption[] = [
  opt('MASCULINO', 'MASCULINO'), opt('FEMENINO', 'FEMENINO'), opt('NO_ESPECIFICO', 'NO ESPECIFICO'),
]

export const PRODUCT_PLAY: SelectOption[] = [
  opt('ONE_PLAY', '1 PLAY'), opt('TWO_PLAY', '2 PLAY'), opt('THREE_PLAY', '3 PLAY'),
]

export const PRODUCT: SelectOption[] = [
  opt('HFC_PURO', 'HFC PURO'),
  opt('HFC_OFERTA_RELAMPAGO', 'HFC OFERTA RELAMPAGO'),
  opt('FTTH_OFERTA_REGULAR', 'FTTH OFERTA REGULAR'),
  opt('FTTH_REGULAR', 'FTTH REGULAR'),
  opt('HFC_REGULAR', 'HFC REGULAR'),
  opt('FTTH_ATAQUE', 'FTTH ATAQUE'),
  opt('HFC_PROMO_BASICO', 'HFC PROMO BASICO'),
  opt('FTTH_PROMO_BASICO', 'FTTH PROMO BASICO'),
  opt('HFC_REGULAR_PRO', 'HFC REGULAR PRO'),
  opt('FTTH_REGULAR_PRO', 'FTTH REGULAR PRO'),
  opt('FTTH_PROMO_1_SOL', 'FTTH PROMO 1 SOL'),
  opt('HFC_PROMO_1_SOL', 'HFC PROMO 1 SOL'),
  opt('HFC_PROMO_GRANDE', 'HFC PROMO GRANDE'),
  opt('FTTH_PROMO_GRANDE', 'FTTH PROMO GRANDE'),
  opt('HFC_ATAQUE', 'HFC ATAQUE'),
]

export const NETWORK_PLAN: SelectOption[] = [
  opt('MB_150', '150 MB'), opt('MB_200', '200 MB'), opt('MB_300', '300 MB'), opt('MB_350', '350 MB'),
  opt('MB_400', '400 MB'), opt('MB_500', '500 MB'), opt('MB_600', '600 MB'), opt('MB_800', '800 MB'),
  opt('MB_1000', '1000 MB'), opt('MB_1500', '1500 MB'), opt('GBPS_2', '2.5 GBPS'), opt('GBPS_5', '5 GPBS'),
]

export const TV_PLAN: SelectOption[] = [
  opt('CLARO_HD_TV_BASICO', 'CLARO HD TV BASICO'),
  opt('CLARO_HD_TV_AVANZADO', 'CLARO HD TV AVANZADO'),
  opt('CLARO_HD_TV_SUPERIOR', 'CLARO HD TV SUPERIOR'),
]

export const PLAIN_PHONE: SelectOption[] = [
  opt('MINUTOS_1000', '1000 minutos'), opt('MINUTOS_2000', '2000 minutos'),
]

export const TYPE_SALE: SelectOption[] = [opt('ALTA_NUEVA', 'ALTA NUEVA'), opt('PORTABILIDAD', 'PORTABILIDAD')]

export const REPETIDOR: SelectOption[] = [
  opt('MESH_1', '1 mesh'), opt('MESH_2', '2 mesh'), opt('MESH_3', '3 mesh'), opt('MESH_4', '4 mesh'), opt('MESH_5', '5 mesh'),
]

export const OPCION_DECO1: SelectOption[] = [
  opt('PUNTO_ADICIONAL_TV_HD_1', '1ER PUNTO ADICIONAL TV HD - S/ 0.00'),
  opt('DECO_DOLBY_ATMOS_1', '1 Deco Dolby Atmos'),
  opt('DECO_BASICO_HD_1', '1 Deco Basico HD - S/10.00'),
  opt('DECO_BASICO_HD_2', '2 Decos Basicos HD - S/20.00'),
  opt('DECO_BASICO_HD_3', '3 Decos Basicos HD - S/30.00'),
  opt('DECO_HD_1', '1 Deco HD - S/15.00'),
  opt('DECO_HD_2', '2 Decos HD - S/30.00'),
  opt('DECO_HD_3', '3 Decos HD - S/45.00'),
  opt('DECO_BASICO_SD_1', '1 Deco Basico SD - S/2.00'),
  opt('DECO_BASICO_SD_2', '2 Decos Basicos SD - S/4.00'),
  opt('DECO_BASICO_SD_3', '3 Decos Basicos SD - S/9.00'),
]

export const OPCION_DECO2: SelectOption[] = [
  opt('DECO_BASICO_SD_1', '1 Deco Basico SD - S/2.00'),
  opt('DECO_BASICO_SD_2', '2 Decos Basicos SD - S/4.00'),
  opt('DECO_BASICO_SD_3', '3 Decos Basicos SD - S/9.00'),
]

export const PREMIUM_PACKS: SelectOption[] = [
  opt('LIGA_1_MAX', 'Liga 1 Max'),
  opt('DECO_GRABADOR_20', 'Deco Grabador S/20.00'),
  opt('PAQUETE_HBO', 'Paquete HBO'),
  opt('PAQUETE_FOX', 'Paquete FOX'),
  opt('GOLDEN_PREMIUN', 'Golden Premiun'),
  opt('HOT_PACK', 'Hot Pack'),
]

export const RECORD_VALIDATION: SelectOption[] = [
  opt('CONTACTO_CON_TERCERO', 'Contacto Con Tercero'),
  opt('PENDIENTE_DE_GRABAR', 'Pendiente de Grabar'),
  opt('PREVENTA_COMPLETO', 'Preventa completo'),
  opt('PREVENTA_INCOMPLETA', 'Preventa Incompleta'),
  opt('PREVENTA_Y_CONTRATO_COMPLETO', 'Preventa y Contrato Completo'),
  opt('CONTRATO_SIN_PREVENTA', 'Contrato sin Preventa'),
]

export const FULL_CLARO: SelectOption[] = [
  opt('FULL_CLARO_MOVIL', 'FULL CLARO - MOVIL'),
  opt('FULL_CLARO_FIJA', 'FULL CLARO - FIJA'),
  opt('NO_APLICA', 'NO APLICA'),
]

export const REGION: SelectOption[] = [
  opt('LIMA', 'LIMA'), opt('NORTE', 'NORTE'), opt('SUR', 'SUR'), opt('CENTRO', 'CENTRO'),
]

export const CLIENT_PAY: SelectOption[] = [
  opt('CLIENTE_PAGARA_LOS_60_SOLES', 'Cliente pagará los 60 soles'),
  opt('EMPRESA_PAGARA_LOS_60_SOLES', 'Empresa pagará los 60 soles'),
  opt('VENTA_CON_INSTALACION_GRATUITA', 'Venta con instalación gratuita'),
]

export const OPERATION_TYPE: SelectOption[] = [
  opt('PLAN_RESIDENCIAL', 'PLAN RESIDENCIAL'), opt('PLAN_CORPORATIVO', 'PLAN CORPORATIVO'),
]

export const BUILD_TYPE: SelectOption[] = [
  opt('EDIFICIO', 'VERTICAL'), opt('CASA', 'HORIZONTAL'),
]

export const HIGH_VALUE: SelectOption[] = [
  opt('NO_CALIFICA_A_PLAN_DE_TV', 'No califica a plan de Tv'),
  opt('CALIFICA_A_PLAN_TV', 'Califica a plan TV'),
  opt('SOLO_QUIERE_INTERNET', 'Solo quiere internet'),
  opt('OTRO', 'OTRO'),
]
