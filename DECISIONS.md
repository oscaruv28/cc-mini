# DECISIONS.md — Bitácora de diseño

> Documento vivo. Registra el **razonamiento** detrás de cada decisión, no solo el resultado.
> Se refina por etapas a medida que avanza el proyecto (ver [ROADMAP.md](./ROADMAP.md)).
>
> Prueba técnica interna WeKall · Mini panel de Contact Center (Engage 360, versión mínima).

---

## 1. Arquitectura general

### Repositorio: monorepo con separación de capas
Un solo repositorio con dos aplicaciones desplegables por separado (`backend/` y `frontend/`).

**Por qué monorepo y no dos repos:**
- El entregable pide "un repositorio Git" con instrucciones para levantarlo. Un solo `clone`, un punto de entrada.
- Ventana de 1–2h: dos repos añaden plomería (CORS entre dominios, dos setups, sincronizar versiones) que resta tiempo del núcleo evaluado (arquitectura + métricas = 45% del peso).
- La separación relevante en este alcance es de **responsabilidades**, no de despliegue. Eso se demuestra dentro del backend, no partiendo el repo.
- "Facilidad para levantarlo" es criterio evaluado (DX): un `docker compose up` gana.

**Trade-off asumido:** en una operación real con equipos y ciclos de release independientes, o un backend consumido por varios clientes, dos repos (o un monorepo con herramienta tipo Nx/Turborepo) se justificaría. Para este alcance sería overhead sin beneficio.

### Docker: un Dockerfile por componente + un compose general
Cada componente construye un runtime distinto (backend Node ejecutando `dist/`; frontend será build estático), así que cada uno tiene su propio `Dockerfile` (multi-stage, imagen de runtime solo con deps de producción). Un único `docker-compose.yml` en la raíz orquesta Postgres + backend + frontend con red interna y `healthcheck`, de modo que `docker compose up --build` levanta el sistema completo desde cero. Esto sostiene el criterio de DX ("facilidad para levantarlo").

```
cc-mini/
├── backend/          # servicio NestJS (capas: api / application / domain / infrastructure)
├── frontend/         # cliente mínimo (interacciones + métricas)
├── docker-compose.yml
├── DECISIONS.md
├── ROADMAP.md
└── README.md
```

### Stack backend
| Decisión | Elección | Por qué |
|---|---|---|
| Lenguaje | **TypeScript** | Tipado del dominio y los DTOs; el compilador ayuda a que las métricas sean correctas. |
| Framework | **NestJS** | Estructura de capas opinada (módulos, providers, DI) que hace explícita la separación de responsabilidades — justo lo que más pesa en la evaluación (25%). |
| ORM | **MikroORM** | Unit of Work + Identity Map, entidades TS limpias, y `QueryBuilder` para las agregaciones de métricas sin caer en traer todo a memoria. |
| Base de datos | **PostgreSQL** | Núcleo de la prueba. `date_trunc('day', opened_at AT TIME ZONE 'America/Bogota')` resuelve la zona horaria (UTC-5) **en el motor**, y `GROUP BY` indexado agrega eficiente cuando los datos crecen. |

### Organización de capas (backend)
- **api** (controllers): entrada/salida HTTP, validación de DTOs, paginación. Sin lógica de negocio.
- **application** (services/casos de uso): orquesta la lógica; transiciones de estado, cálculo de métricas.
- **domain** (entities + reglas): entidades MikroORM y reglas invariantes (p. ej. una interacción resuelta debe tener `closedAt`).
- **infrastructure** (repositorios/config ORM): acceso a datos, migraciones, seed.

### Arquitectura del frontend
SPA en **React + Vite + TypeScript + Tailwind v4 + axios**, organizada por módulos y con separación clara de responsabilidades. Detalle en [docs/FRONTEND.md](./docs/FRONTEND.md).

- **Capa de servicios / gateway (`src/api/`):** un **único cliente axios** (`client.ts`) con `baseURL` por variable de entorno, inyección automática del **Bearer** y manejo central de **401 → logout**. Encima, un **servicio por dominio** (`auth`, `interactions`, `users`, `metrics`, `catalog`). Los componentes **no llaman axios directo** — siempre pasan por estos servicios. Beneficio: un solo lugar para auth, errores y base URL; fácil de testear y de cambiar.
- **Ruteo (`react-router-dom`) con rutas anidadas y `Outlet`:** una *layout route* (`Protected`) valida la sesión y renderiza `AppLayout`, que contiene el `<Outlet/>` donde se pintan las páginas hijas (comparten header/nav sin repetirlo). Redirecciones con `Navigate`, navegación con `NavLink`.
- **Guards por rol:** `Protected` (exige sesión) y `RequireRole` (exige `ADMIN`) protegen las rutas; `HomeRedirect` enruta a `/dashboard` (admin) o `/agent` (agente) según el rol. Es un **portal por rol**.
- **Hooks (`src/hooks/`):** `useAuth` (contexto de sesión: login/logout, token+usuario en `localStorage`) y `useAsync` (envuelve cada consumo con estados de **carga** y **error** explícitos, exigidos por el enunciado).
- **Componentes (`src/components/`) y utils (`src/utils/`):** UI reutilizable (`Button`, `Input`, `Card`, `Spinner`, `ErrorState`, `Badge`, `InteractionsPanel`) y formateadores (fechas en UTC-5, duración, porcentaje). El gráfico de volumen por día es un **bar chart en CSS puro** (sin dependencia extra) — "gráfico simple" como pide el enunciado.

- **Configuración dev/prod (raíz de la API):** `VITE_API_URL` (inyectada por Vite en build). En **dev** = `http://localhost:3000/api` (la SPA en `:5173` llama directo al backend, CORS abierto). En **prod** (Docker) = `/api` (mismo origen): nginx sirve el build estático y hace **proxy** de `/api` al contenedor `backend` — sin CORS ni host quemado. Un `Dockerfile` por componente (front = build Vite → nginx) y un solo `docker-compose` que orquesta todo.

**Trade-off:** no metí librería de estado global (Redux/Zustand) ni de data-fetching (React Query); para este alcance, contexto de auth + `useAsync` bastan y evitan sobre-ingeniería. Con más tráfico/páginas, React Query aportaría cache e invalidación.

---

## 2. Modelo de datos

Detalle completo (tablas, tipos, índices) en [docs/DATA-MODEL.md](./docs/DATA-MODEL.md) · diagrama en [docs/data-model.drawio](./docs/data-model.drawio).

Principio guía: **diseñar pensando en cómo se consultará** (métricas por agente y serie por día), no solo en cómo se guarda.

**Entidades:** `Customer` (empresa cliente) → `User` (equipo de soporte, rol ADMIN/AGENT) → `Call` / `Ticket` (interacciones). Catálogo `Disposition` (tipificación). Disponibilidad del agente: `AgentAvailability` (catálogo, con `can_take_calls`) + `AgentAvailabilityLog` (historial).

**Distinción de nombres (evita confusión):** `Disposition` = cómo concluyó la **interacción** (tipificación). `AgentAvailability` = disponibilidad de la **persona/agente**. Son ejes distintos sobre entidades distintas; la palabra "disposición" en español (disponibilidad) inducía a mezclarlos.

**Alcance de construcción:** `AgentAvailability` + `AgentAvailabilityLog` no las requiere ninguna métrica del enunciado. Se **modelan** (crédito de diseño) pero se **construyen solo si sobra tiempo**, después del núcleo (interacciones + métricas + zona horaria). Disciplina explícita: el enunciado premia lo acotado.

**Decisiones clave:**
- **Dos entidades `Call` y `Ticket`** (no una tabla única), por realismo de dominio: llamada ≠ ticket. Comparten ciclo de vida vía clase base abstracta de MikroORM (reúso sin herencia de tabla).
- **Vista de solo lectura `v_interaction`** (`UNION ALL` de ambas): las métricas agregan sobre la vista con un solo `GROUP BY`, sin duplicar lógica por tabla. Separa modelo de escritura (2 entidades) del de lectura (1 superficie) — CQRS-lite.
- **`Customer` se alcanza vía `User`** (el agente pertenece a una empresa), no como FK directa en la interacción. Trade-off: métricas por empresa piden un join extra; no denormalizo porque ninguna métrica requerida lo necesita.
- **`status` es enum** (3 estados fijos), no tabla. **`timestamptz` en UTC**, conversión a `America/Bogota` en la consulta. **`closed_at` nullable**, solo al resolver. **PK `uuid`** generada por la BD (`gen_random_uuid()`): ids opacos, no enumerables, seguros de exponer.
- **Auth**: login JWT simple (`POST /auth/login` → Bearer token; guard global con excepción `@Public`), agregado **a pedido** aunque el enunciado no lo exige. Es autenticación, no autorización por rol. Hash con `bcryptjs` (JS puro, evita compilación nativa en Windows). Trade-off honesto: suma tiempo fuera del núcleo evaluado. Sin multi-tenancy real.

---

## 3. Endpoint de métricas — agregación y zona horaria

`GET /api/metrics?from&to[&agentId]` devuelve:
- **por agente:** total, resueltas, tasa de resolución, tiempo promedio de resolución (segundos).
- **serie de volumen por día** dentro del rango.

### Agregación en SQL (no en memoria)
Toda la agregación se hace en Postgres sobre la vista `v_interaction` con `count(*)`, `count(*) filter (where status='RESOLVED')` y `avg(extract(epoch from (closed_at - opened_at))) filter (...)`, agrupando por `agent_id`. Nunca se cargan filas a Node para sumar en un `for`. Escala con índices `(agent_id, opened_at)` y `(opened_at)`.

### Zona horaria (UTC-5) resuelta en el motor
- **Agrupar por día:** `to_char((opened_at AT TIME ZONE 'America/Bogota')::date, 'YYYY-MM-DD')`. Convierte el instante UTC (`timestamptz`) a la hora local de Colombia antes de truncar por día. Verificado: una llamada de las 20:00 en Cali (01:00Z del día siguiente) cae en **su** día local, no el siguiente.
- **Límites del rango:** se comparan contra `opened_at` como instantes: `opened_at >= (from::timestamp AT TIME ZONE tz)` y `< ((to+1día)::timestamp AT TIME ZONE tz)`. Así el `WHERE` no aplica funciones sobre la columna → **usa el índice** de `opened_at`, mientras el agrupamiento por día sí convierte la zona en el `SELECT`.

### Alternativas consideradas y descartadas
- **Agrupar por `opened_at::date` (sin zona):** simple pero **incorrecto** — usa UTC y parte mal la medianoche (la de 8pm caería al día siguiente).
- **Traer filas y agrupar en JS con `date-fns-tz`:** correcto pero no escala (trae todo a memoria); contradice el criterio del núcleo.
- **Guardar el día local precalculado en una columna:** rápido de leer pero denormaliza y se rompe si cambia la zona; innecesario con índices.
- **`SET TIME ZONE` por sesión:** frágil (depende del estado de conexión); mejor explícito en la consulta.

---

## 4. Trade-offs
> _Se irá poblando por etapas._
- Monorepo vs dos repos → monorepo (ver §1).
- PostgreSQL vs SQLite → Postgres, priorizando el núcleo de métricas sobre el cero-setup de SQLite; mitigado con docker-compose para no penalizar la DX.

---

## 5. Uso de IA
> _Se irá poblando._ Herramienta principal: Antigravity / asistente. Registrar qué entregó incompleto o incorrecto y qué se validó/corrigió a mano.

---

## 6. Qué haría distinto con más tiempo o en producción
> _Pendiente._
