-- Grupo pertenece a una sola sede.

-- 1) Columna nullable temporal
ALTER TABLE "Grupo" ADD COLUMN "sedeId" TEXT;

-- 2) Backfill: sede activa del supervisor del grupo
UPDATE "Grupo" g
SET "sedeId" = (
  SELECT sa."sedeId"
  FROM "SedeAccess" sa
  WHERE sa."userId" = g."supervisorId" AND sa."active" = true
  ORDER BY sa."grantedAt" DESC
  LIMIT 1
)
WHERE g."sedeId" IS NULL;

-- 3) Fallback: cualquier sede (por si algún supervisor no tuviera acceso asignado)
UPDATE "Grupo" g
SET "sedeId" = (SELECT s."sede_id" FROM "Sede" s ORDER BY s."createdAt" ASC LIMIT 1)
WHERE g."sedeId" IS NULL;

-- 4) Volver NOT NULL
ALTER TABLE "Grupo" ALTER COLUMN "sedeId" SET NOT NULL;

-- 5) Índice y clave foránea
CREATE INDEX "Grupo_sedeId_idx" ON "Grupo"("sedeId");
ALTER TABLE "Grupo" ADD CONSTRAINT "Grupo_sedeId_fkey"
  FOREIGN KEY ("sedeId") REFERENCES "Sede"("sede_id") ON DELETE RESTRICT ON UPDATE CASCADE;
