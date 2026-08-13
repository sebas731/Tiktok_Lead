-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('EN_GESTION', 'INGRESADA', 'RECHAZADO', 'NO_INGRESADA', 'PENDIENTE_DE_INGRESO', 'INSTALADA', 'NO_INSTALADO', 'PRE_RECHAZO', 'OBSERVADO', 'REINGRESADO', 'REASIGNACION', 'REMEDY');

-- CreateEnum
CREATE TYPE "SaleSubStatus" AS ENUM ('SIN_INGRESO', 'PROGRAMADO', 'SIN_PROGRAMAR', 'SEGUIMIENTO', 'EN_EJECUCION', 'PENDIENTE_DE_APROBACION_CREDITICIA', 'PENDIENTE_DE_EVALUACION_CREDITICIA', 'AUDIO_OBSERVADO', 'PENDIENTE_DE_APROBACION_DE_AUDIO', 'PENDIENTE_DE_GRABACION', 'PRE_RECHAZO', 'SIN_AGENDAMIENTO_EN_SISTEMA', 'REINGRESADO', 'DERIVADO_A_PLANTA_EXTERNA', 'PENDIENTE_POR_AMPLIACION_DE_FAT', 'EDIFICIO_SERA_CONSTRUIDO_CON_RED_FTTH', 'CLIENTE_CON_DEUDA', 'DIRECCION_CON_DEUDA', 'EDIFICIO_NO_LIBERADO', 'INGRESADO_POR_OTRO_CANAL', 'SIN_INFRAESTRUCTURA_DE_RED', 'ZONA_PELIGROSA', 'SERVICIO_SUSPENDIDO', 'CONTRATO_MOVISTAR', 'SOT_CON_ERRORES_DE_SISTEMAS', 'NO_CUENTA_CON_SUMINISTRO_DE_LUZ', 'DUPLICIDAD', 'AUDIO_NO_CARGADO', 'POR_MAL_INGRESO_DE_DIRECCION', 'POR_MALA_OFERTA', 'SE_DERIVO_AL_BUZON_DE_ANALISIS_DE_RECHAZO', 'DATOS_INCORRECTOS', 'OFERTA_INVALIDA', 'FALTA_DE_CONTRATO_DE_VOZ', 'RECHAZADO_POR_VALIDACION', 'NO_DESEA_PAGAR_RENTA_ADELANTADA', 'NO_TIENE_DELIVERY_EN_LA_ZONA', 'MIGRACION_DE_PREPAGO_A_POSTPAGO', 'NO_CALIFICA_A_ALTA_NUEVA', 'NO_CALIFICA_A_PORTABILIDAD', 'PLANO_NO_HABILITADO', 'CLIENTE_INUBICABLE', 'CONSULTA_PREVIA', 'NO_HAY_SISTEMA', 'DEUDA_EN_CLARO', 'PENDIENTE_DE_APROBACION_CASO_PARAMETRO', 'DIRECCION_INCORRECTA', 'PENDIENTE_DE_GENERAR_SOT', 'PENDIENTE_DE_DNI_CE', 'SIN_FRANJA_DISPONIBLE_EN_CONSULTA', 'SE_ENVIO_DNI_A_SEGMENTOS', 'CALL_PAGO_INSTALACION', 'CLIENTE_PAGO_INSTALACION', 'BLOQUEADO_POR_EQUIFAX', 'PENDIENTE_DE_PAGO_DE_INST', 'PORTABILIDAD_DEUDA_EN_MOVISTAR', 'SOLICITA_RENTA_ADELANTADA', 'ATENDIDA', 'INSTALADO_POR_CERRAR', 'PENDIENTE_DE_PORTABILIDAD', 'ATENDIDA_X_REASIGNACION', 'ATENDIDA_POR_EMPRESAS', 'ATENDIDA_X_CALL', 'CLIENTE_DESISTE', 'RETENCION_DE_MOVISTAR', 'OTRO', 'SE_MANDO_A_LEVANTAR_SOT', 'SEGUIMIENTO_POR_BACK_NO_CONTESTA', 'REASIGNACION_EN_CONTRA', 'ATENDIDOS_POR_EMPRESAS', 'VERIFICANDO_RED_EN_LA_ZONA', 'PENDIENTE_DE_REASIGNACION', 'A_SOLICITUD_DEL_CLIENTE', 'AUTOMATICO', 'PENDIENTE_DE_ENVIAR', 'ENVIADO_A_REASIGNAR', 'PENDIENTE_DE_INGRESO');

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_editadoPorBackId_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_leadId_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_registradoPorId_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_sedeId_fkey";

-- DropTable
DROP TABLE "Venta";

-- CreateTable
CREATE TABLE "Client" (
    "id_cliente" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL DEFAULT 'DNI',
    "document_number" TEXT NOT NULL,
    "titular_name" TEXT NOT NULL,
    "last_names" TEXT NOT NULL,
    "fathers_name" TEXT,
    "number_calls" TEXT,
    "number_whatsapp" TEXT,
    "operator_client" TEXT,
    "birth_date" TIMESTAMP(3),
    "birth_place" TEXT,
    "gender" TEXT,
    "department" TEXT,
    "province" TEXT,
    "district" TEXT,
    "address" TEXT,
    "reference_address" TEXT,
    "nodo" TEXT,
    "email" TEXT,
    "ubigeo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id_sale" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "campaingId" TEXT NOT NULL,
    "leadId" TEXT,
    "advisorId" TEXT NOT NULL,
    "managerAdvisorId" TEXT,
    "backOfficeId" TEXT,
    "sedeId" TEXT NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" "SaleStatus" NOT NULL DEFAULT 'EN_GESTION',
    "sub_reason" "SaleSubStatus",
    "sale_channel" TEXT,
    "product_play" TEXT,
    "product" TEXT,
    "network_plan" TEXT,
    "tv_plan" TEXT,
    "phone_plan" TEXT,
    "pack_price" DOUBLE PRECISION,
    "repeater" TEXT,
    "deco1" TEXT,
    "deco2" TEXT,
    "premium_pack" TEXT,
    "total_price" DOUBLE PRECISION,
    "observations" TEXT,
    "operation_type" TEXT,
    "address_type" TEXT,
    "high_value" TEXT,
    "sec" TEXT,
    "sot" TEXT,
    "record_validation" TEXT,
    "full_claro" TEXT,
    "consolidado" INTEGER,
    "equifax" TEXT,
    "equifax_document" TEXT,
    "ugis" TEXT,
    "contrata_inst" TEXT,
    "codigo_cliente_pago" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id_sale")
);

-- CreateTable
CREATE TABLE "SaleDetail" (
    "id_sale_detail" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "cod_client" TEXT,
    "payment_date" TIMESTAMP(3),
    "payment_status" TEXT,
    "region" TEXT,
    "pdv" TEXT,
    "rejection_date" TIMESTAMP(3),
    "contrata_ins" TEXT,
    "sales_status" TEXT,
    "sub_sales_status" TEXT,
    "installation_date" TIMESTAMP(3),
    "loteado" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleDetail_pkey" PRIMARY KEY ("id_sale_detail")
);

-- CreateTable
CREATE TABLE "InstallationSchedule" (
    "saleId" TEXT NOT NULL,
    "installation_date" TIMESTAMP(3),
    "installation_time" TEXT,
    "coments" TEXT,

    CONSTRAINT "InstallationSchedule_pkey" PRIMARY KEY ("saleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_code_key" ON "Sale"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_leadId_key" ON "Sale"("leadId");

-- CreateIndex
CREATE INDEX "Sale_campaingId_idx" ON "Sale"("campaingId");

-- CreateIndex
CREATE INDEX "Sale_advisorId_idx" ON "Sale"("advisorId");

-- CreateIndex
CREATE INDEX "Sale_sedeId_idx" ON "Sale"("sedeId");

-- CreateIndex
CREATE INDEX "Sale_reason_idx" ON "Sale"("reason");

-- CreateIndex
CREATE UNIQUE INDEX "SaleDetail_saleId_key" ON "SaleDetail"("saleId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_campaingId_fkey" FOREIGN KEY ("campaingId") REFERENCES "Campaign"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_managerAdvisorId_fkey" FOREIGN KEY ("managerAdvisorId") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_backOfficeId_fkey" FOREIGN KEY ("backOfficeId") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("sede_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDetail" ADD CONSTRAINT "SaleDetail_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id_sale") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationSchedule" ADD CONSTRAINT "InstallationSchedule_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id_sale") ON DELETE RESTRICT ON UPDATE CASCADE;

