# ROADMAP.md — plan por fases

> El proyecto se construyó siguiendo un ciclo de trabajo con sentido:
> **cimientos → dominio → núcleo → datos → calidad → extensiones → seguridad → integración.**
> El núcleo evaluado (interacciones + métricas) se prioriza; lo transversal va después.
> Los refinamientos iterativos y el uso de IA se documentan con honestidad en [DECISIONS.md §5](./DECISIONS.md).
>
> Leyenda: ✅ hecho · 🔄 en curso · ⏳ pendiente/opcional

---

# Parte 1 — Backend (servicio)

### Fase 1 — Fundaciones ✅
- Monorepo con separación de capas; **TypeScript + NestJS 11 + MikroORM 6 + PostgreSQL 16** (stack justificado en DECISIONS §1).
- Config única de MikroORM (app + CLI), `ValidationPipe` global, prefijo `/api`, CORS.
- Swagger en `/api/docs`, health en `/api/health`, `.env`, Dockerfile + docker-compose.

### Fase 2 — Modelo de datos ✅
- Dominio pensado **para la consulta**: `Customer → User → Call/Ticket` (base abstracta), `Disposition`.
- **Vista `v_interaction`** (`UNION ALL`) como superficie de lectura de métricas — separa escritura (2 entidades) de lectura (1 vista).
- PK `uuid`, `timestamptz`, índices `(agent_id, opened_at)`/`(opened_at)`/`(status)`. Migraciones.
- Documentado en [docs/DATA-MODEL.md](./docs/DATA-MODEL.md) + diagrama. DECISIONS §2.

### Fase 3 — Gestión de interacciones (must-have) ✅
- Crear `POST /interactions/{calls,tickets}` (agente + apertura).
- Ciclo de vida `OPEN→IN_PROGRESS→RESOLVED` con validación de transiciones y `closed_at` al resolver.
- Listar `GET /interactions` con filtros (agente/estado/tipo/rango) + paginación (sobre la vista).

### Fase 4 — Núcleo: métricas ✅
- `GET /metrics?from&to[&agentId]`: por agente (total, resueltas, tasa, tiempo promedio) + volumen por día + desglose por tipificación.
- **Agregación 100% en SQL** sobre `v_interaction`; **zona horaria UTC-5** resuelta en el motor (`AT TIME ZONE`), con límites de rango que usan el índice. DECISIONS §3.

### Fase 5 — Datos de ejemplo ✅
- Seed (`npm run seed` → `DatabaseSeeder`): agentes + cientos de interacciones (llamadas y tickets) que cruzan medianoche. Idempotente.
- Backup (`db/init/01-backup.sql`) restaurado al inicializar Postgres, para ver el sistema poblado desde el primer arranque.

### Fase 6 — Calidad: errores y pruebas ✅
- Manejo explícito de errores/entradas inválidas: **400 / 401 / 404 / 409**.
- **Unit tests** (`npm test`, 11/11): máquina de estados y cálculo de métricas (lógica pura extraída).
- **e2e** (`bash scripts/test-e2e.sh`, 9/9): flujo completo API+BD, métricas exactas y frontera de medianoche.
- **Aceptación** (`node scripts/verify.mjs`, 20/20): requisitos + masivo + correctitud API vs BD.

### Fase 7 — Extensiones de dominio ✅
- Catálogos: `GET /roles`, `/customers`, `/dispositions`, `/agent-availabilities`.
- Tipificación de interacciones (`PATCH .../:id/disposition`) + detalle de ticket (`GET .../tickets/:id`).
- Disponibilidad del agente (`AgentAvailability` + `PATCH /users/:id/availability`).
- Simulación de llamadas (`POST /interactions/calls/simulate`).

### Fase 8 — Seguridad y multi-empresa ✅
- Login JWT (`POST /auth/login`) + guard global con `@Public`; hash con `bcryptjs`.
- CRUD de usuarios (`/users`).
- **Aislamiento por empresa**: el token lleva `customerId` y toda la data (interacciones, métricas, usuarios) se filtra por la empresa del usuario.

### Fase 9 — Integración y DX ✅
- `docker compose up --build` levanta Postgres + backend + frontend (nginx proxy `/api`); el backend migra/siembra según env.
- README completo, [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md) (checklist), [docs/TEST-PLAN.md](./docs/TEST-PLAN.md) (guía de prueba).

---

# Parte 2 — Frontend (cliente) ✅

SPA por módulos: **React + Vite + TypeScript + Tailwind + axios**, portal por rol.

- **Fundaciones**: gateway axios (baseURL por env, Bearer, 401→logout), router con guards por rol, hooks (`useAuth`, `useAsync`).
- **Agente**: workspace con softphone (agenda + llamada animada + wrap-up para tipificar antes de guardar), su disponibilidad y tablero de disponibilidad del equipo, y sus llamadas.
- **Admin**: dashboard de métricas (KPIs + tabla por agente con drill-down + volumen por día + tipificación), interacciones globales, módulo de tickets (con detalle) y administración de agentes.
- Estados de **carga** y **error** explícitos en cada consumo.

---

# Parte 3 — Integración ✅
- `docker compose up` conecta todo (front → nginx → backend → Postgres), verificado end-to-end y desde un clon limpio.

---

## Pendiente / opcional (no requerido por el enunciado)
- `AgentAvailabilityLog` (historial de disponibilidad + métricas de ocupación).
- Autorización por rol (RBAC) a nivel backend (hoy hay autenticación + aislamiento por empresa; la separación de roles es de UI).
