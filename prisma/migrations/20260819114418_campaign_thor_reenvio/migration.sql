-- Reenvío al Thor de Jesús: modo y campaña destino por campaña.
ALTER TABLE "Campaign" ADD COLUMN "thorMode" TEXT NOT NULL DEFAULT 'OFF';
ALTER TABLE "Campaign" ADD COLUMN "thorSlug" TEXT;
