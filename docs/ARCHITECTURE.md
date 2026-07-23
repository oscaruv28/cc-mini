# Arquitectura — referencia para leer y justificar

Documento de referencia: qué es cada componente, qué tecnología usa, cómo está
organizada cada carpeta y cómo se manejan los errores. Pensado para sustentar.

---

## 1. Componentes (Docker)

Un `Dockerfile` **por componente** + un `docker-compose.yml` general que los orquesta.

| Componente | Imagen / build | Puerto | Rol |
|---|---|---|---|
| **db** | `postgres:16-alpine` | host `5433` → 5432 | Base de datos. Se inicializa desde `db/init/01-backup.sql` (datos de ejemplo). |
| **backend** | multi-stage: `node:22` build → `node:22` runtime | `3000` | API NestJS. Al arrancar, migra y (opcional) siembra según env. |
| **frontend** | multi-stage: `node:22` build (Vite) → `nginx:alpine` | `8080` → 80 | SPA estática servida por nginx, que además hace **proxy `/api` → backend**. |

Flujo en producción (Docker): **navegador → nginx (frontend) → `/api` proxy → backend → Postgres**.
Mismo origen ⇒ sin CORS ni host quemado. En dev, el front (Vite :5173) llama directo al backend (:3000).

---

## 2. Tecnologías (y por qué)

### Backend
| Tecnología | Por qué |
|---|---|
| **TypeScript** | Tipado del dominio y los DTOs; el compilador ayuda a la correctitud. |
| **NestJS 11** | Estructura de capas opinada (módulos, providers, DI) → separación de responsabilidades explícita. |
| **MikroORM 6** | Unit of Work + Identity Map, entidades TS limpias, y SQL/QueryBuilder para la agregación de métricas. |
| **PostgreSQL 16** | `AT TIME ZONE` para la zona horaria en el motor y `GROUP BY` indexado eficiente. |
| **JWT + bcryptjs** | Autenticación simple; `bcryptjs` (JS puro) evita compilación nativa en Windows. |
| **class-validator** | Validación declarativa de entradas en los DTOs. |
| **Swagger** | Documentación interactiva en `/api/docs`. |
| **Jest + Supertest** | Unit + e2e. |

### Frontend
| Tecnología | Por qué |
|---|---|
| **React + Vite + TS** | Coherente con el backend TS; Vite = arranque/HMR rápidos. |
| **Tailwind v4** | Estilos utilitarios sin CSS suelto. |
| **axios** | Cliente HTTP con interceptores (Bearer, 401) → un gateway único. |
| **react-router-dom** | Ruteo con rutas anidadas (`Outlet`) y guards por rol. |

### Infra
Docker (Dockerfile por componente) · docker-compose · nginx (estáticos + proxy).

---

## 3. Estructura del backend (carpeta por carpeta)

```
backend/src/
├── entities/            # entidades MikroORM + enums (dominio, compartidas por módulos)
│   ├── customer, user, call, ticket, disposition, agent-availability
│   ├── base-interaction (abstracta), interaction-view (vista de lectura), enums
├── auth/                # login JWT, jwt-auth.guard (global), current-user.decorator, dto
├── users/               # CRUD de usuarios (controller / service / dto)
├── interactions/        # crear/estados/listar/simular/tipificar/detalle
│   └── interaction-status.ts   # lógica pura (máquina de estados) → unit-testeable
├── metrics/             # endpoint de métricas
│   └── metrics.mapper.ts       # lógica pura (cálculo por agente) → unit-testeable
├── catalog/             # roles, customers, dispositions, agent-availabilities
├── common/              # transversal
│   └── filters/all-exceptions.filter.ts   # filtro global de errores
├── migrations/          # migraciones MikroORM
├── seeders/             # DatabaseSeeder (bulk), DemoSeeder (catálogos + usuarios)
├── app.module.ts        # ensambla módulos + guard global + filtro global
├── main.ts              # bootstrap: prefijo /api, ValidationPipe, Swagger, migrate/seed
└── mikro-orm.config.ts  # config única (app + CLI)
```

**Convención por módulo** (separación de responsabilidades):
- `*.controller.ts` → entrada/salida HTTP, validación de DTOs, paginación. **Sin lógica de negocio.**
- `*.service.ts` → la lógica (transiciones, agregación, reglas).
- `dto/` → contratos de entrada/salida con `class-validator`.
- **Entidades centralizadas** en `entities/` porque las comparten varios módulos.
- **Lógica pura extraída** (`interaction-status`, `metrics.mapper`) para testearla sin BD.

---

## 4. Estructura del frontend (carpeta por carpeta)

```
frontend/src/
├── api/            # GATEWAY: client.ts (axios + Bearer + 401) + un servicio por dominio
│                   #   auth.api, interactions.api, users.api, metrics.api, catalog.api
├── hooks/          # useAuth (sesión/Context), useAsync (carga/error/reload)
├── components/     # UI reutilizable (ui.tsx), AppLayout (con <Outlet/>), InteractionsPanel
├── modules/
│   ├── auth/       # LoginPage
│   ├── agent/      # AgentWorkspace, Softphone
│   └── admin/      # DashboardPage, InteractionsPage, TicketsPage, AgentsAdminPage
├── router/         # AppRouter (rutas anidadas + guards por rol)
├── utils/          # formato (fechas UTC-5, duración, %)
└── types.ts        # shapes que devuelve la API
```

Regla: **los componentes nunca llaman axios directo** → siempre vía un servicio del gateway,
casi siempre a través de `useAsync` (que da `{ data, loading, error, reload }`).

---

## 5. Manejo de errores

### Backend (dos niveles)
1. **Explícito por caso** (en los services): excepciones de Nest →
   - **400** entrada inválida / regla de negocio (agente inexistente, etc.).
   - **401** sin token / credenciales.
   - **404** recurso no encontrado.
   - **409** transición de estado inválida / conflicto.
2. **Filtro global** `AllExceptionsFilter` (registrado como `APP_FILTER`):
   - Respuesta **consistente**: `{ statusCode, message, path, timestamp }`.
   - **Loguea** lo inesperado (5xx) con stack; los 4xx (negocio) no ensucian el log.
   - Mapea **violación de unicidad de MikroORM → 409**.
   - *Decisión:* se prefirió el **filtro global** (idiomático de NestJS) antes que un decorador
     que envuelva cada método — ese patrón puede tragarse errores.
3. **Validación**: `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) + `class-validator` en DTOs.

### Frontend
- **Gateway**: interceptor de respuesta → **401 ⇒ logout + redirección** a `/login`; helper `apiError` extrae el mensaje.
- **`useAsync`**: cada consumo expone `loading`/`error` → las vistas muestran `Spinner`/`ErrorState` de forma uniforme.

---

## 6. Seguridad y aislamiento
- **Guard global** (`JwtAuthGuard`) protege todo salvo `@Public` (health, login).
- El **JWT lleva `customerId`** → interacciones, métricas y usuarios se **filtran por empresa**: cada usuario solo ve/gestiona su organización.

Ver también: [DECISIONS.md](../DECISIONS.md) (razonamiento y trade-offs) y [FRONTEND.md](./FRONTEND.md) (flujo de datos).
