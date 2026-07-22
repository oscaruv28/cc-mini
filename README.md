# CC-Mini · Mini panel de Contact Center

Servicio que centraliza la actividad de un equipo de atención (llamadas y tickets) y la
expone como **métricas operativas** confiables, con un **portal** por rol. Versión mínima
de la idea de **Engage 360** (WeKall).

## Stack
- **Backend:** TypeScript · NestJS 11 · MikroORM 6 · PostgreSQL 16 · JWT · Swagger.
- **Frontend:** React + Vite + TypeScript · Tailwind v4 · axios (SPA por módulos).
- **Infra:** Docker (un `Dockerfile` por componente) + un `docker-compose` general.

```
cc-mini/
├── backend/            # API NestJS + MikroORM + PostgreSQL
├── frontend/           # SPA React (portal por rol)
├── docs/               # DATA-MODEL, REQUIREMENTS, FRONTEND, diagrama
├── scripts/            # verify.mjs (aceptación), test-e2e.sh
└── docker-compose.yml
```

Documentación: [DECISIONS.md](./DECISIONS.md) · [ROADMAP.md](./ROADMAP.md) ·
[docs/DATA-MODEL.md](./docs/DATA-MODEL.md) · [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md) ·
[docs/FRONTEND.md](./docs/FRONTEND.md)

## Levantar todo con Docker (recomendado)

Requiere Docker Desktop.

```bash
docker compose up --build
```

Levanta **Postgres + backend + frontend**. Postgres se **inicializa desde un backup**
(`db/init/01-backup.sql`) con datos de ejemplo ya poblados —cientos de interacciones que
cruzan medianoche, varios agentes—, de modo que el portal se ve "interactuando" desde el
primer arranque. (Sin backup, el backend puede migrar y sembrar solo con `DB_AUTO_MIGRATE`/`DB_SEED`.)

| Servicio | URL |
|----------|-----|
| Frontend (portal) | http://localhost:8080 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |

**Credenciales demo:**
- Admin: `admin@demo.co` / `admin123` → dashboard de métricas, interacciones, administración de agentes.
- Agente: `agente@demo.co` / `agente123` → workspace (simular llamada, cambiar estado, tipificar, disponibilidad).

Detener: `docker compose down` (conserva datos) · `docker compose down -v` (borra la BD).

## Desarrollo local

Requiere Node 22. Levanta solo la BD con Docker: `docker compose up -d db` (Postgres en `localhost:5433`).

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run migration:up      # crea tablas + vista v_interaction
npm run seed              # catálogos + usuarios + cientos de interacciones
npm run start:dev         # API en http://localhost:3000/api

# Frontend (otra terminal)
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev               # SPA en http://localhost:5173
```

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/health` | Estado del servicio (público) |
| GET/POST/PATCH/DELETE | `/api/users` | CRUD de usuarios (+ `/:id/availability`) |
| POST | `/api/interactions/{calls,tickets}` | Crear interacción |
| POST | `/api/interactions/calls/simulate` | Generar llamadas aleatorias coherentes |
| PATCH | `/api/interactions/{calls,tickets}/:id/status` | Cambiar estado |
| PATCH | `/api/interactions/{calls,tickets}/:id/disposition` | Tipificar |
| GET | `/api/interactions` | Listar (filtros + paginación) |
| GET | `/api/metrics?from&to[&agentId]` | Métricas por agente + volumen por día |
| GET | `/api/roles`, `/customers`, `/dispositions`, `/agent-availabilities` | Catálogos |

Todos (salvo `/health` y `/auth/login`) requieren `Authorization: Bearer <token>`.

## Pruebas

```bash
# Aceptación por API (requisitos + masivo + correctitud métricas vs BD)
node scripts/verify.mjs            # requiere la app y la BD arriba

# Integración e2e (BD de test aislada, seed determinista)
bash scripts/test-e2e.sh
```
