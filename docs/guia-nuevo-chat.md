# Directrices para un nuevo chat de Claude (proyecto CK2 · Tiktok_Lead)

> Pega este documento al inicio de un chat nuevo. Está pensado para que Claude te
> ayude **y te enseñe a la vez**.

## 0) Cómo quiero que trabajes conmigo (estilo)
- **Enséñame mientras hacemos.** Explica en lenguaje simple *qué* vas a cambiar, *por qué*, y *qué efecto* tiene. Nada de tecnicismos sin aclararlos.
- **Muéstrame los comandos uno por uno** y dime qué hace cada uno antes de que yo lo corra.
- **Avísame ANTES** de: tocar la base de datos (migraciones), borrar datos, o cualquier acción difícil de revertir. Dime si algo tiene riesgo.
- **No hagas migraciones si no son necesarias.** Si un cambio necesita migración, dímelo claramente y explícame por qué.
- **Verifica siempre** con `npx tsc --noEmit` (debe quedar en 0 errores) y `npm run build` antes de dar algo por hecho.
- **No manejes mis credenciales** (contraseñas, SSH). Dame los comandos y yo los ejecuto.
- Confírmame antes de `git push`. Commits con mensajes claros.

## 1) El proyecto
- **App:** Next.js 16 (App Router, RSC) · Prisma 7 (driver adapter `@prisma/adapter-pg` + `pg`) · PostgreSQL 17 · Tailwind v4 · auth JWT (`jose`) · bcryptjs. Es **full-stack en un solo proyecto** (las API routes son el "backend").
- **Local:** `C:\Users\usuario\Documents\sistema_ventas_tiktok\tiktok-leads` (Windows, Git Bash + PowerShell).
- **Repo:** `github.com/sebas731/Tiktok_Lead`, rama `main`.
- **VPS (producción):** `ssh user2@169.58.107.24`, carpeta `/var/www/Tiktok_Lead`. Proceso **pm2: `tiktok-leads`** (¡ese nombre exacto!).
- **Roles:** ADMIN, SUPERVISOR, ASESOR, BACK.

## 2) Reglas de oro del código (respétalas)
- Cliente Prisma generado en `lib/generated/prisma`; se importa `from '@/lib/generated/prisma/client'`.
- **Archivos con `'use client'` NO deben importar Prisma** (arrastra el runtime al navegador). Los enums de los combos son strings en `lib/constants/*.ts`.
- **Migraciones (shell no interactivo): `migrate dev` NO funciona.** Flujo: editar `schema.prisma` → escribir a mano `prisma/migrations/<timestamp>_<nombre>/migration.sql` → `npx prisma migrate deploy` → `npx prisma generate` → reiniciar el server.
- **Probar backend:** crear `_tmp_q.ts` en la raíz que importe `@/lib/...`, correr `npx tsx --env-file=.env _tmp_q.ts`, y **borrarlo** después (limpiar datos de prueba).
- Lógica en `lib/<dominio>/service.ts`; permisos en el servidor (`requireAuth`/`requireRole`/`getLeadFilter` en `lib/auth/authorize.ts`). TypeScript **sin `any`**.
- **Nada de monolitos:** archivos por debajo de ~300 líneas; extraer componentes/helpers.
- **Sin emojis en la UI** (se ven poco profesionales); usar SVG. (Los emojis del mensaje de WhatsApp al cliente sí van, porque son parte del texto pedido.)
- Patrón "best-effort en segundo plano" para integraciones (ej. write-back al Sheet): `void fn(...)` sin `await`, `try/catch` silencioso, **nunca rompe la gestión**.

## 3) Flujo de despliegue (paso a paso)
En el VPS, dentro de `/var/www/Tiktok_Lead`:
1. Respaldo del punto actual: `git rev-parse HEAD > ~/last_good_commit.txt`
2. Traer código: `git fetch origin && git reset --hard origin/main`
3. Ver migraciones pendientes: `npx prisma migrate status`
4. Aplicar (si hay) y regenerar: `npx prisma migrate deploy && npx prisma generate`
5. Deps + build (**antes** de reiniciar): `npm install && npm run build`
6. Recargar sin downtime: `pm2 reload tiktok-leads --update-env`
7. Verificar: `pm2 status && pm2 logs tiktok-leads --lines 40`
- **Revertir:** `git reset --hard $(cat ~/last_good_commit.txt) && npm run build && pm2 reload tiktok-leads --update-env`
- El build va **antes** del reload: si falla, la app vieja sigue viva. `git reset --hard` **no toca `.env`**.

## 4) Variables de entorno y crons
- `.env`: `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`, y para el write-back al Sheet: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (el código convierte `\n`).
- **Crons externos** (protegidos con `Authorization: Bearer $CRON_SECRET`):
  - `POST /api/cron/sync` — sincroniza campañas Excel programadas.
  - `POST /api/cron/release-agendados` — suelta AGENDADO vencidos (recomendado cada hora).

## 5) Reglas de negocio ya implementadas (para no romperlas)
- **Autoasignar (modo AUTO):** prioriza SIN_GESTION **más viejos (FIFO)**; si no hay y la campaña lo permite (`allowNoContactoPull`), entrega NO_CONTACTO (nunca el que el mismo asesor dejó NO_CONTACTO).
- **Anti-bucle:** AGENDADO reserva 24 h para su asesor y luego vuelve al pool (se suelta solo). NO_CONTACTO vuelve al pool con 5 h de enfriamiento. POSITIVO/NEGATIVO son finales.
- **Al asignar un AGENDADO** se le da reserva de 24 h (si no, la limpieza lo soltaría al instante).
- **Write-back al Sheet** (SERVICE_ACCOUNT): al gestionar, escribe columnas **ESTADO, SUB-ESTADO y ASESOR** en la fila por número.
- **Rachas** (solo asesor): racha de ventas seguidas hoy (llama roja) y racha diaria de días con venta sin contar domingos (llama morada). Se calculan en vivo (sin BD ni cron).
- **Panel de control** (admin/supervisor): desglose por estado, KPIs (total, promedio, nuevos 5 min) y pestaña Detalle paginada.
- **Quitar acceso a un asesor** suelta sus leads activos y bloquea la entrada por URL.

## 6) Seguridad / operación
- No entrar por SSH con contraseña automatizada. Los arreglos van por **código + git**; el deploy lo corro yo.
- Antes de borrar/editar datos en producción: respaldo (`pg_dump`) y confirmación.

---
**Cómo empezar el chat nuevo:** pega esto y dime qué quiero hacer (p. ej. "quiero desplegar", "quiero agregar X"). Guíame paso a paso y explícame mientras avanzamos.
