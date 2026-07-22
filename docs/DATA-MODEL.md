# Modelo de datos

> Diagrama editable: [`data-model.drawio`](./data-model.drawio) (abrir en [draw.io](https://app.diagrams.net)).
> El razonamiento de diseño vive en [DECISIONS.md §2](../DECISIONS.md).

## Glosario (terminología fijada)

- **Customer** — la **empresa cliente de WeKall** (el "tenant") que usa el contact center.
- **User** — miembro del **equipo de soporte de una empresa** (`Customer`). Pertenece a un `Customer` y tiene `role`:
  - `ADMIN`: el líder; revisa estadísticas y métricas.
  - `AGENT`: atiende y **crea** las interacciones (genera la data).
- **Call / Ticket** — las dos entidades de interacción, cada una asignada a un agente (`User` con rol `AGENT`).

Cadena de pertenencia: `Interaction → User (agente) → Customer (empresa)`. No hay relación entre llamadas y tickets.

## Diseño de escritura vs. lectura (clave)

- **Escritura:** dos entidades independientes, `Call` y `Ticket`, cada una con su tabla. Comparten los campos de ciclo de vida mediante una **clase base abstracta** de MikroORM (`@Entity({ abstract: true })`): reúso de código, sin herencia de tabla ni discriminador (MikroORM solo soporta STI de tabla única, que aquí no usamos).
- **Lectura (métricas):** una **vista SQL de solo lectura `v_interaction`** que hace `UNION ALL` de las columnas comunes de `call` y `ticket` y añade `type`. Las métricas agregan sobre la vista → un solo `GROUP BY`, sin duplicar la lógica por tabla.

Esto separa el modelo de dominio (dos entidades, más realista) del modelo de consulta (una superficie unificada). CQRS-lite.

## Entidades

### Customer
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | generado por la BD (`gen_random_uuid()`) |
| name | varchar | |
| document_id | varchar | NIT/identificador de la empresa (nullable) |
| created_at | timestamptz | |

Entidad de referencia; **no** implica multi-tenancy real (sin aislamiento de datos por empresa). Anotado en DECISIONS §6.

### User
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| name | varchar | |
| email | varchar | único |
| role | enum | `ADMIN` \| `AGENT` |
| password_hash | varchar (null) | hash bcrypt; `hidden`, nunca se serializa |
| customer_id | FK → Customer | la empresa a la que pertenece |
| availability_id | FK → AgentAvailability | disponibilidad actual (nullable; aplica a agentes) |
| created_at | timestamptz | |

Se agregó **login JWT simple** (a pedido; el enunciado no lo exige) → columna `password_hash`. Es **autenticación** (quién eres), no **autorización** por rol: cualquier usuario autenticado accede a los endpoints. El `role` viaja en el token para un futuro control por rol. Sin multi-tenancy real.

### BaseInteraction  *(clase abstracta — no es tabla)*
Campos comunes heredados por `Call` y `Ticket`:

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| status | enum | `OPEN` \| `IN_PROGRESS` \| `RESOLVED` |
| agent_id | FK → User | el agente que la atiende/crea (rol `AGENT`) |
| disposition_id | FK → Disposition | nullable; se fija al resolver |
| opened_at | timestamptz | apertura |
| closed_at | timestamptz | nullable; solo al pasar a `RESOLVED` |
| created_at | timestamptz | auditoría |
| updated_at | timestamptz | auditoría |

### Call  *(tabla `call`, extiende BaseInteraction)*
| Campo | Tipo | Notas |
|---|---|---|
| direction | enum | `INBOUND` \| `OUTBOUND` |
| duration_sec | int | duración de la llamada |
| phone_number | varchar | |

### Ticket  *(tabla `ticket`, extiende BaseInteraction)*
| Campo | Tipo | Notas |
|---|---|---|
| subject | varchar | asunto |
| description | text | detalle de la petición/incidencia |
| priority | enum | `LOW` \| `MEDIUM` \| `HIGH` |
| channel | varchar | canal de entrada |

### Disposition (catálogo de tipificación)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| code | varchar | único (`resuelto`, `no_contesta`, `buzon`, `escalado`...) |
| label | varchar | etiqueta legible |
| active | boolean | permite desactivar sin borrar |

Ninguna métrica requerida depende de `Disposition`; es riqueza de dominio (tipificación operativa de Engage 360).

> **Ojo con la palabra "disposición":** `Disposition` es cómo concluyó la **interacción** (tipificación). La **disponibilidad del agente** es otra cosa y se llama `AgentAvailability` (abajo). No confundir.

### AgentAvailability (catálogo de disponibilidad del agente)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| code | varchar | único (`AVAILABLE`, `BUSY`, `ON_BREAK`, `OFFLINE`, `ACW`...) |
| label | varchar | etiqueta legible |
| can_take_calls | boolean | codifica la regla "puede atender llamadas o no" |
| active | boolean | permite desactivar sin borrar |

Estado en el que está la **persona** (agente) ahora mismo. Aplica a llamadas, no a tickets.

### AgentAvailabilityLog (historial de disponibilidad)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| agent_id | FK → User | el agente |
| agent_availability_id | FK → AgentAvailability | estado en ese tramo |
| started_at | timestamptz | inicio del tramo |
| ended_at | timestamptz | fin del tramo (null = tramo actual) |

Permite medir rendimiento por franjas (tiempo disponible, ocupación, adherencia). **Ninguna métrica requerida lo usa** → se modela ahora; se construye solo si sobra tiempo (ver §Alcance).

### v_interaction  *(VISTA de solo lectura)*
Definida en migración con SQL. Unifica lo que las métricas necesitan:

```sql
CREATE VIEW v_interaction AS
  SELECT id, 'CALL'   AS type, status, agent_id, disposition_id, opened_at, closed_at FROM call
  UNION ALL
  SELECT id, 'TICKET' AS type, status, agent_id, disposition_id, opened_at, closed_at FROM ticket;
```

Para métricas por empresa, se une `v_interaction.agent_id → user.customer_id`.

## Relaciones

- `Customer (1) —— (N) User` → una empresa tiene muchos usuarios (su equipo de soporte).
- `User (1) —— (N) Call` y `User (1) —— (N) Ticket` → un agente atiende/crea muchas interacciones.
- `Disposition (1) —— (N) Call/Ticket` → nullable (cómo concluyó la interacción).
- `AgentAvailability (1) —— (N) User` → disponibilidad actual del agente (nullable).
- `AgentAvailability (1) —— (N) AgentAvailabilityLog` y `User (1) —— (N) AgentAvailabilityLog` → historial de disponibilidad.
- `Call` y `Ticket` → alimentan la vista `v_interaction` (solo lectura).
- **No hay** relación `Call ↔ Ticket`.

## Decisiones de modelo orientadas a la consulta

El enunciado pide "diseñar pensando en cómo se consultará". Por eso:

1. **Dos entidades `Call`/`Ticket` + vista `v_interaction`.** Dominio realista (cada tipo con sus campos) sin que las métricas paguen el precio de unir tablas en cada consulta: agregan sobre la vista con un solo `GROUP BY`.
2. **`Customer` se alcanza vía `User`, no directo en la interacción.** Refleja que el usuario que crea/atiende pertenece a una empresa. Trade-off: métricas por empresa requieren un join extra (`agent → customer`); no denormalizo `customer_id` en la interacción porque ninguna métrica requerida lo pide.
3. **`status` como enum, no como tabla.** 3 estados de ciclo de vida fijos; un catálogo agregaría join y FK sin beneficio.
4. **Timestamps `timestamptz` en UTC.** El agrupamiento "por día" convierte a `America/Bogota` **en la consulta** (`opened_at AT TIME ZONE 'America/Bogota'`), no depende de la zona del servidor.
5. **`closed_at` nullable**, invariante: solo se llena cuando `status = RESOLVED`. Tiempo de resolución = `closed_at − opened_at`, definido solo para resueltas.
6. **PK `uuid`** generada por la BD con `gen_random_uuid()` (nativo en Postgres 16, sin dependencia extra): ids opacos, no adivinables ni enumerables, seguros de exponer en la API/URLs y cómodos para generar del lado cliente o fusionar datos de varias fuentes. Trade-off: ocupan más y tienen peor localidad de índice que un serial; para el volumen de la prueba es despreciable, y a cambio los ids no filtran información de volumen.
7. **Índices** (en ambas tablas `call` y `ticket`):
   - `(agent_id, opened_at)` → métricas por agente en rango.
   - `(opened_at)` → serie de volumen por día y filtro por rango.
   - `(status)` → filtro por estado y conteo de resueltas.

## Trade-off asumido de separar Call/Ticket

Duplicamos los campos de ciclo de vida en dos tablas (mitigado por la clase base abstracta en código) y mantenemos la vista sincronizada si cambian columnas comunes. A cambio: entidades de dominio más fieles a la operación real (llamadas ≠ tickets), que fue la decisión de negocio.

## Alcance de construcción (disciplina)

El enunciado premia lo acotado. Se **modela todo** (suma al criterio de modelado), pero se **construye en código por prioridad**:

1. **Núcleo (siempre):** `Customer`, `User`, `Call`, `Ticket`, `Disposition`, vista `v_interaction` → CRUD de interacciones, filtros/paginación, endpoint de métricas y zona horaria.
2. **Solo si sobra tiempo:** `AgentAvailability` + `AgentAvailabilityLog` (disponibilidad del agente) → modeladas y con seed ligero; se cablean al final. Ninguna métrica requerida depende de ellas.

## Fuera de alcance (anotado)

- **Autenticación/roles efectivos**: solo el campo `role`, sin control de acceso.
- **Multi-tenancy real** por Customer.
- **Portal de tickets cara-al-cliente**: la creación de tickets se pliega en el panel mínimo; no se construye portal aparte.
