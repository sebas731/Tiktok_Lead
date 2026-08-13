-- CreateEnum
CREATE TYPE "Pdv" AS ENUM ('PDV_LIMA', 'PDV_NORTE');

-- CreateEnum
CREATE TYPE "Equifax" AS ENUM ('PENDIENTE DE VALIDAR', 'APROBADO', 'DESAPROBADO', 'NO PROCEDE');

-- CreateEnum
CREATE TYPE "Loteado" AS ENUM ('NO', 'SI', 'VOLVER A GRABAR', 'NO HAY GRABACION', 'ENVIADO-SUBSANADO', 'PENDIENTE DE LOTEAR', 'FALTA GRAVE DE CALIDAD');

-- CreateEnum
CREATE TYPE "NetworkPlan" AS ENUM ('150 MB', '200 MB', '300 MB', '350 MB', '400 MB', '500 MB', '600 MB', '800 MB', '1000 MB', '1500 MB', '2.5 GBPS', '5 GPBS');

-- CreateEnum
CREATE TYPE "TvPlan" AS ENUM ('CLARO HD TV BASICO', 'CLARO HD TV AVANZADO', 'CLARO HD TV SUPERIOR');

-- CreateEnum
CREATE TYPE "TypeSale" AS ENUM ('ALTA_NUEVA', 'PORTABILIDAD');

-- CreateEnum
CREATE TYPE "Repetidor" AS ENUM ('1 mesh', '2 mesh', '3 mesh', '4 mesh', '5 mesh');

-- CreateEnum
CREATE TYPE "OpcionDeco1" AS ENUM ('1ER PUNTO ADICIONAL TV HD - S/ 0.00', '1 Deco Dolby Atmos', '1 Deco Basico HD - S/10.00', '2 Decos Basicos HD - S/20.00', '3 Decos Basicos HD - S/30.00', '1 Deco HD - S/15.00', '2 Decos HD - S/30.00', '3 Decos HD - S/45.00', '1 Deco Basico SD - S/2.00', '2 Decos Basicos SD - S/4.00', '3 Decos Basicos SD - S/9.00');

-- CreateEnum
CREATE TYPE "OpcionDeco2" AS ENUM ('1 Deco Basico SD - S/2.00', '2 Decos Basicos SD - S/4.00', '3 Decos Basicos SD - S/9.00');

-- CreateEnum
CREATE TYPE "PremiunPacks" AS ENUM ('Liga 1 Max', 'Deco Grabador S/20.00', 'Paquete HBO', 'Paquete FOX', 'Golden Premiun', 'Hot Pack');

-- CreateEnum
CREATE TYPE "RecordValidation" AS ENUM ('Contacto Con Tercero', 'Pendiente de Grabar', 'Preventa completo', 'Preventa Incompleta', 'Preventa y Contrato Completo', 'Contrato sin Preventa');

-- CreateEnum
CREATE TYPE "FullClaro" AS ENUM ('FULL CLARO - MOVIL', 'FULL CLARO - FIJA', 'NO APLICA');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('LIMA', 'NORTE', 'SUR', 'CENTRO');

-- CreateEnum
CREATE TYPE "ClientPay" AS ENUM ('Cliente pagará los 60 soles', 'Empresa pagará los 60 soles', 'Venta con instalación gratuita');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('PLAN RESIDENCIAL', 'PLAN CORPORATIVO');

-- CreateEnum
CREATE TYPE "HighValue" AS ENUM ('No califica a plan de Tv', 'Califica a plan TV', 'Solo quiere internet', 'OTRO');

-- CreateEnum
CREATE TYPE "BuildType" AS ENUM ('VERTICAL', 'HORIZONTAL');

-- AlterEnum
BEGIN;
CREATE TYPE "PlainPhone_new" AS ENUM ('1000 minutos', '2000 minutos');
ALTER TABLE "Sale" ALTER COLUMN "phone_plan" TYPE "PlainPhone_new" USING ("phone_plan"::text::"PlainPhone_new");
ALTER TYPE "PlainPhone" RENAME TO "PlainPhone_old";
ALTER TYPE "PlainPhone_new" RENAME TO "PlainPhone";
DROP TYPE "public"."PlainPhone_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Product_new" AS ENUM ('HFC PURO', 'HFC OFERTA RELAMPAGO', 'FTTH OFERTA REGULAR', 'FTTH REGULAR', 'HFC REGULAR', 'FTTH ATAQUE', 'HFC PROMO BASICO', 'FTTH PROMO BASICO', 'HFC REGULAR PRO', 'FTTH REGULAR PRO', 'FTTH PROMO 1 SOL', 'HFC PROMO 1 SOL', 'HFC PROMO GRANDE', 'FTTH PROMO GRANDE', 'HFC ATAQUE');
ALTER TABLE "Sale" ALTER COLUMN "product" TYPE "Product_new" USING ("product"::text::"Product_new");
ALTER TYPE "Product" RENAME TO "Product_old";
ALTER TYPE "Product_new" RENAME TO "Product";
DROP TYPE "public"."Product_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProductPlay_new" AS ENUM ('1 PLAY', '2 PLAY', '3 PLAY');
ALTER TABLE "Sale" ALTER COLUMN "product_play" TYPE "ProductPlay_new" USING ("product_play"::text::"ProductPlay_new");
ALTER TYPE "ProductPlay" RENAME TO "ProductPlay_old";
ALTER TYPE "ProductPlay_new" RENAME TO "ProductPlay";
DROP TYPE "public"."ProductPlay_old";
COMMIT;

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "operator_client",
ADD COLUMN     "operator_client" "Operator" NOT NULL DEFAULT 'CLARO',
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'NO_ESPECIFICO';

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "equifax",
ADD COLUMN     "client_pay" "ClientPay" NOT NULL,
ADD COLUMN     "number_record" TEXT,
ADD COLUMN     "region" "Region" NOT NULL DEFAULT 'CENTRO',
ADD COLUMN     "type_sale" "TypeSale" NOT NULL DEFAULT 'ALTA_NUEVA',
ALTER COLUMN "reason" SET DEFAULT 'INGRESADA',
DROP COLUMN "sale_channel",
ADD COLUMN     "sale_channel" "SaleChannel" NOT NULL DEFAULT 'TIKTOK',
DROP COLUMN "product_play",
ADD COLUMN     "product_play" "ProductPlay" NOT NULL DEFAULT '3 PLAY',
DROP COLUMN "product",
ADD COLUMN     "product" "Product" NOT NULL DEFAULT 'HFC PURO',
DROP COLUMN "network_plan",
ADD COLUMN     "network_plan" "NetworkPlan" NOT NULL DEFAULT '150 MB',
DROP COLUMN "tv_plan",
ADD COLUMN     "tv_plan" "TvPlan" NOT NULL DEFAULT 'CLARO HD TV BASICO',
DROP COLUMN "phone_plan",
ADD COLUMN     "phone_plan" "PlainPhone" NOT NULL DEFAULT '1000 minutos',
DROP COLUMN "repeater",
ADD COLUMN     "repeater" "Repetidor" NOT NULL DEFAULT '1 mesh',
DROP COLUMN "deco1",
ADD COLUMN     "deco1" "OpcionDeco1" NOT NULL DEFAULT '1 Deco Basico HD - S/10.00',
DROP COLUMN "deco2",
ADD COLUMN     "deco2" "OpcionDeco2" NOT NULL DEFAULT '1 Deco Basico SD - S/2.00',
DROP COLUMN "premium_pack",
ADD COLUMN     "premium_pack" "PremiunPacks" NOT NULL,
DROP COLUMN "operation_type",
ADD COLUMN     "operation_type" "OperationType" NOT NULL,
DROP COLUMN "address_type",
ADD COLUMN     "address_type" "BuildType" NOT NULL,
DROP COLUMN "high_value",
ADD COLUMN     "high_value" "HighValue" NOT NULL,
DROP COLUMN "record_validation",
ADD COLUMN     "record_validation" "RecordValidation" NOT NULL,
DROP COLUMN "full_claro",
ADD COLUMN     "full_claro" "FullClaro" NOT NULL;

-- AlterTable
ALTER TABLE "SaleDetail" DROP COLUMN "payment_date",
DROP COLUMN "payment_status",
DROP COLUMN "region",
DROP COLUMN "sales_status",
DROP COLUMN "sub_sales_status",
ADD COLUMN     "equifax" "Equifax" NOT NULL,
DROP COLUMN "pdv",
ADD COLUMN     "pdv" "Pdv" NOT NULL,
DROP COLUMN "loteado",
ADD COLUMN     "loteado" "Loteado" NOT NULL;

