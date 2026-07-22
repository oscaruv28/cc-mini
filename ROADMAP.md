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

## Etapa 1 — Modelo de datos ⏳
- ⏳ Entidades del dominio (agente, interacción) con MikroORM.
- ⏳ Estados de interacción: `abierta → en_progreso → resuelta` (+ `closedAt` al resolver).
- ⏳ Índices pensados para las consultas de métricas (agente, estado, timestamps).
- ⏳ DTOs de entrada/salida con validación.
- ⏳ Migración inicial.
- ⏳ Documentar el modelo en DECISIONS §2.

## Etapa 2 — Gestión de interacciones (API) ⏳
- ⏳ Crear interacción (tipo llamada/ticket, agente, timestamp de apertura).
- ⏳ Cambiar estado con validación de transiciones.
- ⏳ Listar con filtros (agente, estado, rango de fechas) + paginación.
- ⏳ Manejo explícito de errores y entradas inválidas.

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
