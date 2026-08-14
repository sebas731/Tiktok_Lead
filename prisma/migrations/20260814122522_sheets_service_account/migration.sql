-- Modelo "una pestaña = una campaña": Service Account + estado de sync.

-- Enums
CREATE TYPE "SheetAccessMode" AS ENUM ('PUBLIC_CSV', 'SERVICE_ACCOUNT');
CREATE TYPE "SyncStatus" AS ENUM ('OK', 'ERROR');

-- Nuevas columnas en Campaign
ALTER TABLE "Campaign" ADD COLUMN "excelSheetName" TEXT;
ALTER TABLE "Campaign" ADD COLUMN "sheetAccessMode" "SheetAccessMode" NOT NULL DEFAULT 'PUBLIC_CSV';
ALTER TABLE "Campaign" ADD COLUMN "lastSyncStatus" "SyncStatus";
ALTER TABLE "Campaign" ADD COLUMN "lastSyncError" TEXT;

-- Se elimina el filtrado por columna (ya no aplica)
ALTER TABLE "Campaign" DROP COLUMN IF EXISTS "excelCampaignFilter";
ALTER TABLE "Campaign" DROP COLUMN IF EXISTS "excelCampaignColumn";
