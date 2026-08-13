-- CreateEnum
CREATE TYPE "SaleChannel" AS ENUM ('BASE_DE_DATOS', 'RRSS_THOR', 'RECUPEROS', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM', 'GOOGLE');

-- CreateEnum
CREATE TYPE "Operator" AS ENUM ('MOVISTAR', 'CLARO', 'ENTEL', 'BITEL');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMENINO', 'NO_ESPECIFICO');

-- CreateEnum
CREATE TYPE "ProductPlay" AS ENUM ('ONE_PLAY', 'TWO_PLAY', 'THREE_PLAY');

-- CreateEnum
CREATE TYPE "Product" AS ENUM ('HFC_PURO', 'HFC_OFERTA_RELAMPAGO', 'FTTH_OFERTA_REGULAR', 'FTTH_REGULAR', 'HFC_REGULAR', 'FTTH_ATAQUE', 'HFC_PROMO_BASICO', 'FTTH_PROMO_BASICO', 'HFC_REGULAR_PRO', 'FTTH_REGULAR_PRO', 'FTTH_PROMO_1_SOL', 'HFC_PROMO_1_SOL', 'HFC_PROMO_GRANDE', 'FTTH_PROMO_GRANDE', 'HFC_ATAQUE');

-- CreateEnum
CREATE TYPE "PlainPhone" AS ENUM ('MINUTOS_1000', 'MINUTOS_2000');

-- CreateTable
CREATE TABLE "LeadProcessLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "LEAD_STATUS" NOT NULL,
    "sub_status" "LEAD_SUBSTATUS" NOT NULL,
    "observations" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadProcessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadProcessLog_leadId_idx" ON "LeadProcessLog"("leadId");

-- CreateIndex
CREATE INDEX "LeadProcessLog_userId_idx" ON "LeadProcessLog"("userId");

-- AddForeignKey
ALTER TABLE "LeadProcessLog" ADD CONSTRAINT "LeadProcessLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadProcessLog" ADD CONSTRAINT "LeadProcessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

