# ROADMAP.md — Plan por partes

> Documento vivo. Refleja el estado real. Leyenda: ✅ hecho · 🔄 en curso · ⏳ pendiente

El proyecto tiene tres partes: **Backend** (servicio), **Frontend** (cliente) e **Integración**.

---

# Parte 1 — Backend (servicio) · núcleo completo ✅

### 1.1 Fundaciones ✅
- Monorepo con separación de capas; TypeScript + NestJS 11 + MikroORM 6 + PostgreSQL 16.
- Config única de MikroORM (app + CLI), `ValidationPipe` global, prefijo `/api`, CORS.
- Swagger en `/api/docs`; health en `/api/health`; `.env` + `docker-compose`.

### 1.2 Modelo de datos ✅
- Entidades `Customer`, `User`, `Call`, `Ticket` (base abstracta), `Disposition`, `AgentAvailability`.
- Vista de lectura `v_interaction` (`UNION ALL`) para métricas.
- PK `uuid`, `timestamptz`, índices `(agent_id, opened_at)`/`(opened_at)`/`(status)`. Migraciones aplicadas.
- Documentado en [docs/DATA-MODEL.md](./docs/DATA-MODEL.md) + diagrama.

### 1.3 Autenticación ✅
- Login JWT `POST /auth/login` (bcryptjs), guard global con `@Public`, Swagger con Authorize.

### 1.4 Usuarios ✅
- CRUD `/users` (crear/listar+filtros/ver/actualizar/eliminar), protegido, sin filtrar `passwordHash`.

### 1.5 Interacciones ✅
- Crear `POST /interactions/{calls,tickets}`.
- Cambiar estado con validación de transiciones (`OPEN→IN_PROGRESS→RESOLVED`, `closed_at` al resolver).
- Listar `GET /interactions` (filtros agente/estado/tipo/rango + paginación) sobre `v_interaction`.
- **Simular** `POST /interactions/calls/simulate` (llamadas aleatorias coherentes).
- **Tipificar** `PATCH /interactions/{calls,tickets}/:id/disposition`.
- Errores explícitos 400/404/409.

### 1.6 Catálogos ✅
- `GET /roles`, `GET /customers`, `GET /dispositions`, `GET /agent-availabilities`. Seed de catálogos.

### 1.7 Disponibilidad del agente ✅
- `AgentAvailability` (catálogo con `can_take_calls`) + `PATCH /users/:id/availability`.
- ⏳ `AgentAvailabilityLog` (historial) + métricas por franja — opcional.

### 1.8 Métricas (núcleo) ✅
- `GET /metrics?from&to[&agentId]`: por agente (total, resueltas, tasa, tiempo promedio) + volumen por día.
- Agregación 100% en SQL; zona horaria UTC-5 en el motor. Verificado (frontera de medianoche).

### 1.9 Cierre del backend 🔄
- ✅ Script de aceptación `scripts/verify.mjs` (requisitos + masivo + correctitud API vs BD, 20/20).
- ✅ **Seed formal** (`npm run seed` → `DatabaseSeeder`): agentes + cientos de interacciones (llamadas y tickets) que cruzan medianoche. Idempotente.
- ✅ **README** completo (instalar/levantar/probar/endpoints).
- ✅ **Entrypoint** (backend migra + siembra al arrancar según env) → `docker compose up` desde cero verificado (550 interacciones sin pasos manuales).
- ✅ Pruebas de integración e2e (`backend/test/app.e2e-spec.ts`, 9/9): auth, ciclo de vida, filtros/paginación, métricas exactas + zona horaria.

---

# Parte 2 — Frontend (cliente) 🔄

Stack: **React + Vite + TypeScript + Tailwind v4 + axios**, SPA, portal por rol.

### 2.0 Setup ✅
- `frontend/` con gateway axios (baseURL por env, Bearer automático, 401 → logout), router, módulos.

### 2.1 Autenticación ✅
- Login → guarda JWT + usuario → lo adjunta en cada request → rutas protegidas y **guard por rol**.

### 2.2 Vista de interacciones ✅
- Lista con filtros (agente, estado, tipo, rango) + paginación, reutilizable (`InteractionsPanel`).
- Estados de **carga** y **error** explícitos (`useAsync` + `Spinner`/`ErrorState`).

### 2.3 Acciones sobre interacciones ✅
- Botón **Simular llamada**, cambiar estado, tipificar, cambiar disponibilidad del agente.

### 2.4 Dashboard de métricas ✅
- Selector de rango; tabla por agente (total, resueltas, tasa, tiempo promedio); gráfico de volumen por día.

### 2.5 Pulido + Docker ✅
- Servicio `frontend` en `docker-compose` (build Vite → nginx), con proxy `/api` → backend.
- `VITE_API_URL` configurable dev (`localhost:3000/api`) / prod (`/api` mismo origen).

---

# Parte 3 — Integración 🔄
- ✅ `docker compose up --build` levanta Postgres + backend + frontend (nginx proxy `/api`). Verificado end-to-end.
- ✅ **Pruebas de integración e2e** (Jest + Supertest) contra BD de test aislada, seed determinista: auth, ciclo de vida, filtros/paginación, y **métricas exactas + frontera de medianoche UTC-5**. 9/9. Reproducible: `bash scripts/test-e2e.sh`.
- ✅ Entrypoint del backend: migración + seed automáticos al arrancar (arranque desde cero verificado, 550 interacciones).
- ✅ README raíz con el flujo completo de arranque.

---

## Anotado / fuera de alcance
- Autorización por rol (solo hay autenticación); multi-tenancy real; portal de tickets cara-al-cliente.
- Decisión pendiente: re-sincronizar `docs/data-model.drawio` a `uuid`/`AgentAvailability`.
