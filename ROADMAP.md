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
- ⏳ **Seed formal** (`npm run seed`): varios agentes + cientos de interacciones (llamadas y tickets) que crucen medianoche. *(Hoy se puebla vía `simulate` / SQL; falta el comando único.)*
- ⏳ **README** completo (instalar/levantar/probar/endpoints).
- ⏳ **Entrypoint Docker** para `docker compose up` con migración + seed automáticos.
- ⏳ Tests unitarios (máquina de estados, agregación de métricas).

---

# Parte 2 — Frontend (cliente) ⏳

> Decisión pendiente: **stack** (recomendado React + Vite + TypeScript; alternativa Vue).

### 2.0 Setup ⏳
- Proyecto en `frontend/`, cliente HTTP con base `/api` (var de entorno), router, manejo de token.

### 2.1 Autenticación ⏳
- Pantalla de login → guarda el JWT → lo adjunta en cada request → rutas protegidas.

### 2.2 Vista de interacciones ⏳
- Lista con filtros (agente, estado, tipo, rango) + paginación.
- Estados de **carga** y **error** explícitos (must-have del enunciado).

### 2.3 Acciones sobre interacciones ⏳
- Botón **Simular llamada** (elige agente → `simulate`).
- Crear llamada/ticket, cambiar estado, tipificar.
- Cambiar disponibilidad del agente.

### 2.4 Dashboard de métricas ⏳
- Selector de rango de fechas.
- Tabla por agente (total, resueltas, tasa, tiempo promedio).
- Gráfico simple de volumen por día.

### 2.5 Pulido + Docker ⏳
- Servicio `frontend` en `docker-compose` (build estático servido por nginx).

---

# Parte 3 — Integración ⏳
- `docker compose up` levanta Postgres + backend (migración + seed) + frontend, todo conectado.
- README raíz con el flujo completo de arranque.

---

## Anotado / fuera de alcance
- Autorización por rol (solo hay autenticación); multi-tenancy real; portal de tickets cara-al-cliente.
- Decisión pendiente: re-sincronizar `docs/data-model.drawio` a `uuid`/`AgentAvailability`.
