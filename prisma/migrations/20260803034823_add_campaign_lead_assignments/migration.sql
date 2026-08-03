-- CreateEnum
CREATE TYPE "IPType" AS ENUM ('COMPANY', 'PERSONAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'CE', 'PASSAPORTE', 'RUC');

-- CreateEnum
CREATE TYPE "LEAD_STATUS" AS ENUM ('NEGATIVO', 'POSITIVO', 'AGENDADO', 'NO_CONTACTO', 'SIN_GESTION');

-- CreateEnum
CREATE TYPE "LEAD_SUBSTATUS" AS ENUM ('OTRO', 'VENTA', 'CLIENTE_NO_SOLICITO_INFORMACION', 'NO_TIENE_COBERTURA', 'LO_PENSARA', 'LLAMAR_MAS_TARDE', 'CELULAR_APAGADO', 'NO_CONTESTA');

-- CreateTable
CREATE TABLE "AllowedIP" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "description" TEXT,
    "type" "IPType" NOT NULL DEFAULT 'PERSONAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "AllowedIP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ROL" (
    "id_rol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ROL_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "first_last_name" TEXT NOT NULL,
    "second_last_name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'LIMA',
    "document_type" "DocumentType" NOT NULL DEFAULT 'DNI',
    "document_number" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idRol" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Key" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "campaign_id" TEXT NOT NULL,
    "tiktokCampaignId" TEXT NOT NULL,
    "tiktokAdvertiserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "denomination" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "keyId" TEXT NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name_client" TEXT,
    "client_number" TEXT NOT NULL,
    "status" "LEAD_STATUS" NOT NULL DEFAULT 'SIN_GESTION',
    "sub_status" "LEAD_SUBSTATUS" NOT NULL DEFAULT 'OTRO',
    "observations" TEXT,
    "reason" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "asignadoAId" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAssignment" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssignment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "asesorId" TEXT NOT NULL,
    "asignadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSaleDetail" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadSaleDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllowedIP_ip_userId_key" ON "AllowedIP"("ip", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_document_number_key" ON "User"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_tiktokCampaignId_key" ON "Campaign"("tiktokCampaignId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_campaignId_idx" ON "Lead"("campaignId");

-- CreateIndex
CREATE INDEX "Lead_asignadoAId_idx" ON "Lead"("asignadoAId");

-- CreateIndex
CREATE INDEX "CampaignAssignment_userId_idx" ON "CampaignAssignment"("userId");

-- CreateIndex
CREATE INDEX "CampaignAssignment_campaignId_idx" ON "CampaignAssignment"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignAssignment_campaignId_userId_key" ON "CampaignAssignment"("campaignId", "userId");

-- CreateIndex
CREATE INDEX "LeadAssignment_leadId_idx" ON "LeadAssignment"("leadId");

-- CreateIndex
CREATE INDEX "LeadAssignment_asesorId_idx" ON "LeadAssignment"("asesorId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadSaleDetail_leadId_key" ON "LeadSaleDetail"("leadId");

-- AddForeignKey
ALTER TABLE "AllowedIP" ADD CONSTRAINT "AllowedIP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_idRol_fkey" FOREIGN KEY ("idRol") REFERENCES "ROL"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "Key"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAssignment" ADD CONSTRAINT "CampaignAssignment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAssignment" ADD CONSTRAINT "CampaignAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_asignadoPorId_fkey" FOREIGN KEY ("asignadoPorId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSaleDetail" ADD CONSTRAINT "LeadSaleDetail_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSaleDetail" ADD CONSTRAINT "LeadSaleDetail_editadoPorBackId_fkey" FOREIGN KEY ("editadoPorBackId") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
