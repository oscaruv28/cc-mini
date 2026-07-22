# CC-Mini · Mini panel de Contact Center

Servicio que centraliza la actividad de un equipo de atención (llamadas y tickets) y la
expone como métricas operativas confiables. Versión mínima de la idea de **Engage 360** (WeKall).

Monorepo con separación de capas:

```
cc-mini/
├── backend/    # Servicio: API NestJS + MikroORM + PostgreSQL
├── frontend/   # Cliente mínimo (pendiente)
└── docker-compose.yml
```

## Stack

- **Backend:** TypeScript + NestJS 11
- **ORM / DB:** MikroORM 6 + PostgreSQL 16
- **Docs API:** Swagger (OpenAPI) en `/api/docs`

Las decisiones de diseño y su razonamiento están en [DECISIONS.md](./DECISIONS.md).
El plan por etapas, en [ROADMAP.md](./ROADMAP.md).

## Cómo levantar

### Con Docker (recomendado)

Requiere Docker Desktop.

```bash
docker compose up --build
```

Levanta PostgreSQL + backend. La API queda en `http://localhost:3000/api`.

### Local (desarrollo)

Requiere Node 22 y una instancia de PostgreSQL (o `docker compose up db`).

```bash
cd backend
cp .env.example .env      # ajusta credenciales si hace falta
npm install
npm run start:dev
```

## Endpoints

| Método | Ruta            | Descripción                    |
|--------|-----------------|--------------------------------|
| GET    | `/api/health`   | Estado del servicio            |
| —      | `/api/docs`     | Documentación interactiva (Swagger) |

> Los endpoints de interacciones y métricas se documentan a medida que se implementan.
