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

### Organización de capas (backend) — _a detallar en etapa de modelo_
- **api** (controllers): entrada/salida HTTP, validación de DTOs, paginación. Sin lógica de negocio.
- **application** (services/casos de uso): orquesta la lógica; transiciones de estado, cálculo de métricas.
- **domain** (entities + reglas): entidades MikroORM y reglas invariantes (p. ej. una interacción resuelta debe tener `closedAt`).
- **infrastructure** (repositorios/config ORM): acceso a datos, migraciones, seed.

---

## 2. Modelo de datos
> _Pendiente — se completa en la etapa de entidades/DTOs._

Principio guía: **diseñar pensando en cómo se consultará** (métricas por agente y serie por día), no solo en cómo se guarda.

---

## 3. Endpoint de métricas — agregación y zona horaria
> _Pendiente — núcleo de la prueba._

Puntos que este documento deberá justificar:
- Cómo se agrega sin traer todo a memoria (agregación en SQL, no en un `for`).
- Cómo se respeta UTC-5 en el agrupamiento "por día" (una interacción de las 8 p.m. en Cali pertenece a ese día, no al siguiente).
- Alternativas consideradas y descartadas.

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
