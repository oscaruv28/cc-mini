# Guion de sustentación

Frases listas para defender el proyecto, por criterio de evaluación. Habla desde
la **decisión y el porqué**, no desde el "hice X".

**Pitch de 20 segundos (arranque):**
> "Construí un servicio que centraliza llamadas y tickets y expone métricas confiables.
> Backend NestJS como **monolito modular** con separación de responsabilidades, y una SPA
> que consume la API. Prioricé el **núcleo** (modelo de datos → interacciones → métricas con
> zona horaria correcta) y dejé lo transversal (auth, extras) después, documentado."

---

## Arquitectura (25%)
- "Organicé **por responsabilidad**, no por tabla: un **módulo por dominio** (`interactions`, `metrics`, `auth`, `users`, `catalog`), cada uno con `controller` (API) / `service` (lógica) / `dto` (validación); entidades centralizadas."
- "Separé **escritura y lectura**: dos entidades `Call`/`Ticket` (dominio realista) + una **vista `v_interaction`** que leen las métricas → un solo `GROUP BY`, sin duplicar lógica. Es CQRS-lite."
- "Elegí **monolito modular a propósito** (el enunciado premia lo acotado). Documenté la evolución a **API Gateway + servicios**, y como cada módulo ya es candidato a servicio, esa migración sería incremental."

## Calidad de código (20%)
- "**TypeScript** de punta a punta, nombres del dominio, y **manejo de errores explícito**: 400 (datos inválidos), 401 (sin token), 404 (no existe), 409 (transición inválida)."
- "Además un **filtro global de excepciones** (idiomático de NestJS): respuesta de error consistente (`{statusCode, message, path, timestamp}`), loguea lo inesperado (5xx) y mapea violaciones de unicidad a 409. Preferí el filtro global antes que un decorador que envuelva cada método (ese patrón puede tragarse errores)."
- "Saqué la **lógica pura a módulos testeables**: la máquina de estados (`interaction-status`) y el cálculo de métricas (`metrics.mapper`)."
- "Consistencia: un **gateway** único en el front, DTOs con `class-validator`, y una convención por módulo."

## Núcleo: métricas (20%) — *aquí miran de cerca*
- "La **agregación ocurre 100% en SQL** sobre la vista (`count`, `count filter`, `avg`), **nunca en memoria** — no traigo filas para sumar en un `for`."
- "La **zona horaria se resuelve en el motor**: `opened_at AT TIME ZONE 'America/Bogota'`. Lo probé con la **frontera de medianoche**: una llamada de las **8 p.m. en Cali** cuenta en **su** día, no el siguiente."
- "Los **límites del rango** se comparan como instantes para **usar el índice** de `opened_at`, mientras el agrupamiento por día convierte la zona en el `SELECT`."
- "Validé los números con un **script que compara la API contra un `SELECT` independiente** con ~5k registros, y con la prueba e2e de números exactos."

## API y modelo de datos (15%)
- "Endpoints REST por recurso; el **listado tiene filtros** (agente/estado/tipo/rango) **+ paginación**."
- "El modelo se diseñó **para la consulta**: índices `(agent_id, opened_at)`, `(opened_at)`, `(status)`, y la **vista** como superficie de lectura."
- "`Customer → User → interacción`: el cliente se alcanza vía el agente (no FK directa), y con más necesidad se denormalizaría — trade-off anotado. PK `uuid`, `timestamptz`."

## Documento de decisiones (15%)
- "DECISIONS.md cuenta el **razonamiento y las alternativas descartadas**: por qué monolito, por qué dos entidades + vista, cómo resolví la zona horaria (y qué descarté: agrupar por `::date` sin zona, agregar en JS…), los trade-offs, el **uso de IA** (incluidos los bugs que metió y cómo los detecté), y los **alcances futuros**."

## Tests y DX (5%)
- "Pirámide de pruebas: **unit 11/11** (lógica pura) + **e2e 9/9** (flujo completo API+BD) + **aceptación 20/20** (API vs BD)."
- "DX: **`docker compose up` levanta todo** (Postgres + backend + frontend), migra y restaura un **backup** con datos de ejemplo. Hay README y una **guía de prueba** paso a paso."

---

## Preguntas trampa (y respuestas)
- **¿Por qué no microservicios / API Gateway?** → Sería sobre-ingeniería para el alcance; el monolito modular es lo correcto. La evolución está documentada y el diseño está listo para migrar por módulos.
- **¿Por qué carpeta por módulo y no por entidad?** → Organicé por **caso de uso**: `Call` y `Ticket` comparten ciclo de vida (viven en `interactions`), y `metrics` no tiene entidad propia (lee una vista). Una carpeta por tabla partiría cosas que van juntas.
- **¿Cómo garantizas eficiencia con muchos registros?** → Agregación en SQL + índices; verificado con ~5k registros comparando API vs BD.
- **¿Y la zona horaria?** → En el motor con `AT TIME ZONE`; probada con la frontera de medianoche.
- **¿Los extras (auth, softphone, multi-empresa) no son sobre-alcance?** → Son **extras conscientes**; el núcleo está completo y priorizado. Los marqué como decisión, no como dispersión.
- **¿Cómo aíslas datos entre empresas?** → El JWT lleva `customerId` y toda consulta (interacciones, métricas, usuarios) se filtra por la empresa del usuario. Verificado: una segunda empresa ve 0.
