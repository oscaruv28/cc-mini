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

## Etapa 1 — Modelo de datos ✅
- ✅ Esquema documentado ([docs/DATA-MODEL.md](./docs/DATA-MODEL.md)) + diagrama ([docs/data-model.drawio](./docs/data-model.drawio)).
- ✅ Decisiones de modelo en DECISIONS §2.
- ✅ Entidades MikroORM núcleo: `Customer`, `User`, `BaseInteraction` (abstracta), `Call`, `Ticket`, `Disposition` — DDL validado.
- ✅ Enums (`InteractionStatus`, `InteractionType`, `CallDirection`, `TicketPriority`, `UserRole`).
- ✅ Índices `(agent_id, opened_at)`, `(opened_at)`, `(status)` en `call` y `ticket`.
- ✅ PK `uuid` (`gen_random_uuid()`).
- ✅ Migración inicial (+ vista `v_interaction` con `UNION ALL`) — aplicada en runtime.
- ✅ DTOs de entrada/salida con validación.

## Simulación, tipificación y catálogos (a pedido) ✅
- ✅ `POST /interactions/calls/simulate` — genera N llamadas aleatorias coherentes por agente (dirección, duración, teléfono, apertura en 14 días que cruza medianoche, estado ponderado, tipificación si resuelta).
- ✅ Tipificar: `PATCH /interactions/{calls|tickets}/:id/disposition`.
- ✅ Catálogos: `GET /roles`, `GET /customers`, `GET /dispositions`, `GET /agent-availabilities`.
- ✅ Cambiar disponibilidad: `PATCH /users/:id/availability`.
- ✅ Seed de catálogos (5 tipificaciones + 5 disponibilidades).

## Etapa 7 — Disponibilidad del agente 🔄
- ✅ Entidad `AgentAvailability` (catálogo, `can_take_calls`) + FK `user.availability_id` + migración + seed.
- ✅ Endpoint para cambiar la disponibilidad (con validación).
- ⏳ `AgentAvailabilityLog` (historial) + métricas por franja (ocupación/adherencia) — sigue como opcional.

## Etapa 2 — Gestión de interacciones (API) ✅
- ✅ Crear: `POST /interactions/calls` y `/tickets` (DTOs con validación).
- ✅ Cambiar estado con validación de transiciones (`OPEN→IN_PROGRESS→RESOLVED`, `closed_at` al resolver).
- ✅ Listar `GET /interactions` sobre la vista, con filtros (agente/estado/tipo/rango) + paginación.
- ✅ Manejo de errores (400 agente inválido, 404 no existe, 409 transición inválida).
- ✅ Verificado en runtime + smoke test (ver `scripts/verify.mjs`).

## Auth (extra, a pedido) ✅
- ✅ Login JWT `POST /auth/login`; guard global (`@Public` en health/login).
- ✅ `password_hash` en `user` (bcryptjs) + migración + semilla demo (`admin@demo.co`/`admin123`, `agente@demo.co`/`agente123`).
- ✅ Swagger con botón Authorize (bearer). Verificado en runtime.
- ✅ CRUD de usuarios (`/users`: crear/listar+filtros/ver/actualizar/eliminar), protegido, sin filtrar `passwordHash`. Verificado en runtime.

## Etapa 3 — Endpoint de métricas (núcleo) ✅
- ✅ `GET /metrics?from&to[&agentId]`: por agente (total, resueltas, tasa, tiempo promedio) + serie de volumen por día.
- ✅ Agregación en SQL sobre `v_interaction` (sin traer a memoria).
- ✅ Zona horaria UTC-5 resuelta en el motor (`AT TIME ZONE`), con límites de rango que usan el índice de `opened_at`.
- ✅ Verificado: prueba de frontera de medianoche (8pm Cali cuenta en su día) + contraste vs UTC ingenuo.
- ✅ DECISIONS §3 documentada.
- ⏳ Casos borde adicionales (rango vacío/invertido ya cubierto con 400).

## Etapa 4 — Seed de datos ⏳
- ⏳ Script/seed: varios agentes, cientos de interacciones, fechas que crucen medianoche UTC-5.

## Etapa 5 — Frontend mínimo ⏳
- ⏳ Vista de interacciones con filtros.
- ⏳ Vista de métricas (tabla o gráfico simple).
- ⏳ Manejo de estados de carga y error.

## Etapa 6 — Cierre: DX, tests y docs 🔄
- ✅ Script de aceptación `scripts/verify.mjs`: mapea cada requisito a una prueba de API + masivo + correctitud API vs BD (20/20 con ~5k interacciones).
- ⏳ Tests unitarios donde aporten (máquina de estados, agregación, zona horaria).
- ⏳ README: instalar, levantar, probar, endpoints.
- ⏳ DECISIONS.md completo (uso de IA, qué haría distinto).
- ⏳ Verificar arranque limpio desde cero (docker compose up con entrypoint de migración+seed).
