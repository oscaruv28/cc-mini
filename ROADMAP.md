# ROADMAP.md — Plan por etapas

> Documento vivo. Se refina a medida que avanzamos. Marca el estado real de cada etapa.
>
> Leyenda: ✅ hecho · 🔄 en curso · ⏳ pendiente

---

## Etapa 0 — Decisiones y scaffold ✅
- ✅ Decisión de repositorio: monorepo con separación de capas.
- ✅ Stack backend: TypeScript + NestJS + MikroORM + PostgreSQL.
- ✅ Scaffold NestJS en `backend/` (Nest 11 + TS 5.7).
- ✅ Integrar MikroORM v6 (`@mikro-orm/nestjs`, `@mikro-orm/postgresql`) con config única (`src/mikro-orm.config.ts`) compartida por app y CLI.
- ✅ Validación global de DTOs (`ValidationPipe`) + prefijo `/api` + CORS.
- ✅ Health check en `GET /api/health`.
- ✅ Swagger (OpenAPI) en `/api/docs`.
- ✅ README inicial en la raíz.
- ✅ Docker: `Dockerfile` por componente (multi-stage) + `docker-compose.yml` general en la raíz (Postgres 16 + backend, con healthcheck).
- ✅ Variables de entorno (`.env.example`).
- ⏳ Entrypoint que ejecute `migration:up` + `seed` al arrancar el contenedor (se cablea cuando existan migraciones/seed).
- ⏳ Servicio `frontend` en docker-compose (etapa de frontend).

## Etapa 1 — Modelo de datos 🔄
- ✅ Esquema documentado ([docs/DATA-MODEL.md](./docs/DATA-MODEL.md)) + diagrama ([docs/data-model.drawio](./docs/data-model.drawio)).
- ✅ Decisiones de modelo en DECISIONS §2.
- ✅ Entidades MikroORM núcleo: `Customer`, `User`, `BaseInteraction` (abstracta), `Call`, `Ticket`, `Disposition` — DDL validado con `schema:create --dump`.
- ✅ Enums (`InteractionStatus`, `InteractionType`, `CallDirection`, `TicketPriority`, `UserRole`).
- ✅ Índices `(agent_id, opened_at)`, `(opened_at)`, `(status)` en `call` y `ticket`.
- ✅ PK `uuid` (`gen_random_uuid()`).
- ⏳ Migración inicial (+ vista `v_interaction` con `UNION ALL`) — requiere BD arriba o migración a mano.
- ⏳ DTOs de entrada/salida con validación.

## Etapa 7 — Disponibilidad del agente (solo si sobra tiempo) ⏳
- ⏳ Entidades `AgentAvailability` (catálogo, `can_take_calls`) + `AgentAvailabilityLog` (historial).
- ⏳ Seed ligero de estados.
- ⏳ Endpoint/UI de disponibilidad y métricas por franja (ocupación/adherencia).
- Nota: ninguna métrica requerida depende de esto; se cablea al final.

## Etapa 2 — Gestión de interacciones (API) 🔄 (código listo, falta probar en runtime)
- ✅ Crear: `POST /interactions/calls` y `/tickets` (DTOs con validación).
- ✅ Cambiar estado con validación de transiciones (`OPEN→IN_PROGRESS→RESOLVED`, `closed_at` al resolver).
- ✅ Listar `GET /interactions` sobre la vista, con filtros (agente/estado/tipo/rango) + paginación.
- ✅ Manejo de errores (400 agente inválido, 404 no existe, 409 transición inválida).
- ⏳ **Verificar en runtime** (requiere Postgres) + smoke test de endpoints.

## Etapa 3 — Endpoint de métricas (núcleo) ⏳
- ⏳ Por agente en un rango: total, resueltas, tasa de resolución, tiempo promedio de resolución.
- ⏳ Serie de volumen por día en UTC-5.
- ⏳ Agregación en SQL (sin traer todo a memoria).
- ⏳ Zona horaria resuelta en el motor.
- ⏳ Casos borde (rango vacío, sin resueltas, cruces de medianoche).
- ⏳ Documentar decisión en DECISIONS §3.

## Etapa 4 — Seed de datos ⏳
- ⏳ Script/seed: varios agentes, cientos de interacciones, fechas que crucen medianoche UTC-5.

## Etapa 5 — Frontend mínimo ⏳
- ⏳ Vista de interacciones con filtros.
- ⏳ Vista de métricas (tabla o gráfico simple).
- ⏳ Manejo de estados de carga y error.

## Etapa 6 — Cierre: DX, tests y docs ⏳
- ⏳ Tests donde aporten (transiciones de estado, agregación, zona horaria).
- ⏳ README: instalar, levantar, probar, endpoints.
- ⏳ DECISIONS.md completo (trade-offs, uso de IA, qué haría distinto).
- ⏳ Verificar arranque limpio desde cero.
