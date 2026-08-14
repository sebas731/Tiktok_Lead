-- Resumen detallado de la última sincronización (por campaña).
ALTER TABLE "Campaign" ADD COLUMN "lastSyncSummary" JSONB;
