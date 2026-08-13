-- CreateEnum
CREATE TYPE "CampaignSource" AS ENUM ('TIKTOK', 'EXCEL');

-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_keyId_fkey";

-- DropForeignKey
ALTER TABLE "LeadSaleDetail" DROP CONSTRAINT "LeadSaleDetail_editadoPorBackId_fkey";

-- DropForeignKey
ALTER TABLE "LeadSaleDetail" DROP CONSTRAINT "LeadSaleDetail_leadId_fkey";

-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "data_mode",
DROP COLUMN "link_Excel",
ADD COLUMN     "excelGid" TEXT,
ADD COLUMN     "excelUrl" TEXT,
ADD COLUMN     "source" "CampaignSource" NOT NULL DEFAULT 'TIKTOK',
ALTER COLUMN "tiktokCampaignId" DROP NOT NULL,
ALTER COLUMN "tiktokAdvertiserId" DROP NOT NULL,
ALTER COLUMN "keyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tiktokLeadId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "LeadSaleDetail";

-- CreateTable
CREATE TABLE "Sede" (
    "sede_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("sede_id")
);

-- CreateTable
CREATE TABLE "SedeAccess" (
    "id" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SedeAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grupo" (
    "grupo_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("grupo_id")
);

-- CreateTable
CREATE TABLE "GrupoMember" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "asesorId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrupoMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "venta_id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "agenteNombre" TEXT NOT NULL,
    "supervisorNombre" TEXT NOT NULL,
    "canalVenta" TEXT NOT NULL,
    "titularNombre" TEXT NOT NULL,
    "contactoNombre" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "nombrePadres" TEXT,
    "tipoDocumento" "DocumentType" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "numeroGrabacion" TEXT,
    "numeroLlamadas" INTEGER NOT NULL DEFAULT 0,
    "editadoPorBackId" TEXT,
    "editadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("venta_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sede_code_key" ON "Sede"("code");

-- CreateIndex
CREATE INDEX "SedeAccess_userId_idx" ON "SedeAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SedeAccess_sedeId_userId_key" ON "SedeAccess"("sedeId", "userId");

-- CreateIndex
CREATE INDEX "Grupo_supervisorId_idx" ON "Grupo"("supervisorId");

-- CreateIndex
CREATE INDEX "GrupoMember_asesorId_idx" ON "GrupoMember"("asesorId");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoMember_grupoId_asesorId_key" ON "GrupoMember"("grupoId", "asesorId");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_leadId_key" ON "Venta"("leadId");

-- CreateIndex
CREATE INDEX "Venta_sedeId_idx" ON "Venta"("sedeId");

-- CreateIndex
CREATE INDEX "Venta_registradoPorId_idx" ON "Venta"("registradoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_tiktokLeadId_key" ON "Lead"("tiktokLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_client_number_campaignId_key" ON "Lead"("client_number", "campaignId");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "Key"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SedeAccess" ADD CONSTRAINT "SedeAccess_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("sede_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SedeAccess" ADD CONSTRAINT "SedeAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grupo" ADD CONSTRAINT "Grupo_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoMember" ADD CONSTRAINT "GrupoMember_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("grupo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoMember" ADD CONSTRAINT "GrupoMember_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("sede_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_editadoPorBackId_fkey" FOREIGN KEY ("editadoPorBackId") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

