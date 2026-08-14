-- Modo de asignación de leads + opt-in de sincronización programada.
CREATE TYPE "LeadMode" AS ENUM ('NORMAL', 'AUTO');
ALTER TABLE "Campaign" ADD COLUMN "leadMode" "LeadMode" NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Campaign" ADD COLUMN "autoSync" BOOLEAN NOT NULL DEFAULT true;
