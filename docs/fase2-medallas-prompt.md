# Fase 2 — Medallas / Logros del asesor (prompt para retomar)

> Pega este documento como prompt cuando quieras que implemente la Fase 2.
> La Fase 1 (rachas con llamas animadas) YA está hecha y en `main`.

## Contexto ya decidido (no re-preguntar)
- **Venta = Lead en estado `POSITIVO`** (se cuenta al dejar el lead en POSITIVO). Rastro en `LeadProcessLog` (status POSITIVO, userId = asesor).
- **Zona horaria: Lima (UTC-5 fijo, sin horario de verano).** Ya hay helpers de fecha-Lima en `lib/gamification/streaks.ts` (reutilizar/extraer).
- **Cierre del día por cron externo** tipo el de sync: endpoint protegido con `Authorization: Bearer $CRON_SECRET`. Correr ~23:00 Lima.
- Feature **solo para asesores**. Ya existe la página `/dashboard/perfil` (`components/perfil/MiPerfilView.tsx`) y el helper `lib/gamification/streaks.ts`.
- Convenciones del repo (respetar): archivos < 300 líneas, sin monolitos, lógica en `lib/<dominio>/service.ts`, permisos en servidor, sin `any`, migraciones a mano + `prisma migrate deploy` + `prisma generate`, verificar con `tsc` y `npm run build`.

## Qué hay que construir

### 1) Medalla "Mejor del día"
- Al **cerrar el día**, el cron determina **quién hizo más ventas ese día** (más leads a POSITIVO).
- Se registra ese día como ganado por esa persona.
- **La primera vez** que un asesor es "el mejor del día", al entrar le aparece **UNA VEZ** un **modal de celebración**:
  - Pequeño, mismas vibras que la imagen de Duolingo (fondo degradado alegre, ilustración/medalla, número grande opcional).
  - Medalla tipo **"El mejor del día"**.
  - Botón **"Aceptar"**.
  - El mensaje debe incluir **la fecha del día** al que se refiere el logro.
- La medalla queda visible en la **barra del panel de arriba** (TopBar). Al **pasar el mouse** sale una **leyenda** explicando qué es.

### 2) Medalla "Mejor del mes"
- Al **cierre** (fin de mes), el asesor con más ventas del mes.
- **Solo la ve quien la ganó.** Mismo patrón de medalla en la barra + leyenda al hover.
- (Definir si también lleva modal de celebración como el del día.)

### 3) Medalla "Récord" (global)
- Hace referencia a **la persona con más leads en estado venta en un solo día** (máximo histórico).
- **NO** se recalcula por día: se actualiza **solo cuando alguien rompe el récord** (supera el máximo de ventas en un día).
- Se muestra al **poseedor actual** del récord (medalla en la barra + leyenda con el número y/o fecha del récord).

### Detalles visuales
- Animaciones bonitas y coherentes con las llamas de la Fase 1 (`components/perfil/FlameBadge.tsx`).
- Medallas en la barra superior (`components/layout/TopBar.tsx`) con tooltip/leyenda al hover.
- El modal de "mejor del día" debe sentirse celebratorio pero **pequeño** y profesional (sin emojis frágiles; usar SVG/ilustración).

## Propuesta técnica (a validar al implementar)

### Datos (migración aditiva)
Tabla nueva sugerida `Achievement` (o `Medal`):
- `id`
- `userId` (FK User)
- `type`: enum `MEJOR_DEL_DIA | MEJOR_DEL_MES | RECORD`
- `refDate` (día o mes al que refiere; para récord, la fecha del récord)
- `value` (ej. cantidad de ventas de ese día/mes/récord)
- `seenAt` (nullable) — para saber si ya se mostró el modal de celebración (marca "visto")
- `createdAt`
- Índices por `userId` y `type`. Único por (`userId`,`type`,`refDate`) para idempotencia del cron.

Para el **récord global** basta con quedarse con el `Achievement` de tipo RECORD vigente (o una fila singleton). Al batirse, se crea uno nuevo / se reasigna.

### Endpoints
- `POST /api/cron/daily-awards` (Bearer CRON_SECRET):
  - Calcula el ganador del día anterior (o del día en curso al cierre) — **idempotente** (no duplicar si ya se corrió).
  - Actualiza el récord si el máximo del día supera el récord vigente.
  - Al cambiar de mes, calcular "mejor del mes".
- `GET /api/me/achievements` (asesor): sus medallas para la barra + si hay algún logro **no visto** (para disparar el modal una sola vez).
- `POST /api/me/achievements/:id/seen` (o similar): marcar el logro como visto al pulsar "Aceptar".

### Frontend
- Modal `AchievementModal` (celebración, "Aceptar", fecha) — se dispara si `GET /api/me/achievements` trae un logro sin `seenAt`.
- Medallas en `TopBar` con leyenda (tooltip) — reutilizar patrón de `InfoHint`.
- Sección de medallas en `MiPerfilView` (reemplazar el texto "Próximamente: medallas").

## Preguntas abiertas a resolver al implementar
1. **Empates** en "mejor del día": ¿se premia a todos los que empatan en el máximo, o a nadie / al primero por hora? (Sugerido: a todos los que empatan en el máximo, si el máximo > 0.)
2. **Días sin ventas**: si nadie vendió, no hay "mejor del día" (no se premia).
3. **Domingos**: ¿el "mejor del día" aplica domingos? (Sugerido: no, coherente con que no se trabaja.)
4. ¿El modal de celebración es solo la **primera vez** que ganan ese tipo de medalla, o **cada vez** que la ganan? (Tu mensaje dice "si es la primera vez… le saldrá una vez": sugerido = modal solo la primera vez por tipo; las siguientes solo actualizan la medalla en la barra.)
5. ¿"Mejor del mes" lleva modal como el del día, o solo medalla silenciosa?
6. ¿La medalla "mejor del día" en la barra se muestra **siempre** (porque alguna vez lo fue) o solo mientras sea el logro más reciente? (Sugerido: mostrar las medallas ganadas de forma permanente; el récord muestra solo al poseedor vigente.)
7. Hora exacta del cron y si el cálculo es del **día que cierra** (23:00 del mismo día) o del **día anterior** (00:10 del día siguiente).

## Checklist de entrega (Fase 2)
- [ ] Migración a mano + `prisma migrate deploy` + `prisma generate`.
- [ ] Servicio `lib/gamification/awards.ts` (cálculo de ganadores, récord, mes).
- [ ] Endpoints cron + me/achievements.
- [ ] Modal de celebración + medallas en TopBar con leyenda.
- [ ] Sección de medallas en Mi perfil.
- [ ] `tsc` en 0 y `npm run build` OK.
- [ ] Instrucciones de despliegue (incluye migración + configurar el cron externo).
