-- Índices compuestos para acelerar consultas de leads (7k+).
CREATE INDEX IF NOT EXISTS "Lead_campaignId_asignadoAId_status_idx" ON "Lead"("campaignId", "asignadoAId", "status");
CREATE INDEX IF NOT EXISTS "Lead_campaignId_createdAt_idx" ON "Lead"("campaignId", "createdAt");
