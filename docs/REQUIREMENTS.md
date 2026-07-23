# Checklist de requisitos — fiel al enunciado

Lista tal cual la pide el documento de la prueba. Marcamos check por requisito cumplido.

`[x]` cumplido · `[~]` parcial · `[ ]` pendiente
Verificación reproducible del backend: `node scripts/verify.mjs`.

---

## 1. Requisitos funcionales — Must-have

### 1.1 Gestión de interacciones
- [x] Crear una interacción (tipo **llamada** o **ticket**), asignada a un agente, con timestamp de apertura
- [x] Cambiar su estado: `abierta → en_progreso → resuelta`; al resolverse se registra el timestamp de cierre
- [x] Listar interacciones con filtros (agente, estado, rango de fechas) y paginación

### 1.2 Núcleo — Endpoint de métricas
- [x] Recibe un rango de fechas y devuelve, **por agente**: total de interacciones, total resueltas, tasa de resolución y tiempo promedio de resolución (cierre − apertura)
- [x] Serie de **volumen por día** dentro del rango
- [x] (1) Agregación **correcta y eficiente** con muchos registros — no traer todo a memoria (se hace en SQL)
- [x] (2) El agrupamiento "por día" respeta la **zona horaria UTC-5** (8 p.m. en Cali cuenta ese día)

### 1.3 Interfaz mínima
- [x] Vista que liste interacciones con sus filtros (agente/estado/tipo/rango + paginación)
- [x] Vista de métricas (tabla por agente + gráfico simple de volumen por día)
- [x] El frontend consume la API con sensatez y maneja estados de **carga** y **error**

---

## 2. Pautas técnicas
- [x] Backend en Node; framework/lenguaje/DB/ORM elegidos y **justificados** en DECISIONS
- [x] Frontend a elección (React + Vite + TS + Tailwind + axios, SPA por módulos)
- [x] Modelo de datos diseñado pensando en **cómo se consultará**
- [x] **Script o seed** que cargue datos suficientes (cientos de interacciones, varios agentes, fechas que crucen medianoche) — `npm run seed` (`DatabaseSeeder`), y automático en `docker compose up`
- [x] Maneja **errores y entradas inválidas** de forma explícita (no asume camino feliz)

---

## 3. Entregables
- [x] Repositorio Git con el código, **instrucciones para levantarlo** y el **seed** (`docker compose up` migra+siembra solo)
- [x] **DECISIONS.md** (ver detalle abajo)
- [x] **README** — cómo instalar, levantar y probar; endpoints disponibles

### 3.1 Contenido esperado en DECISIONS.md
- [x] Arquitectura general (capas, responsabilidades, dónde vive la lógica) — §1
- [x] Modelo de datos (entidades, relaciones, por qué facilita las métricas) — §2
- [x] Endpoint de métricas (agregación + zona horaria; alternativas consideradas y descartadas) — §3
- [x] Trade-offs (decisiones con costos asumidos) — §4
- [x] Uso de IA (en qué te apoyaste, qué entregó mal/incompleto, qué corregiste/validaste) — §5
- [x] Qué harías distinto con más tiempo o en producción — §6

---

## 4. Cómo lo evalúan (pesos) — referencia
| Criterio | Peso | Cómo vamos |
|----------|------|-----------|
| Arquitectura (separación de responsabilidades) | 25 | sólido (capas + módulos + CQRS-lite de lectura) |
| Calidad de código (legibilidad, nombres, errores) | 20 | consistente; falta algún test unitario |
| Núcleo: métricas (agregación, zona horaria, borde) | 20 | ✅ verificado |
| API y modelo de datos (endpoints, dominio, filtros, paginación) | 15 | ✅ |
| Documento de decisiones | 15 | ✅ §1–§6 completas (incl. IA y "qué haría distinto") |
| Tests y DX (pruebas, README, facilidad de levantar) | 5 | ✅ unit (11/11) + e2e (9/9) + aceptación (20/20) + README + `docker compose up` un comando |

---

## Resumen
- **Todos los must-have (1.1, 1.2, 1.3) ✅**, pautas técnicas ✅, entregables ✅.
- Verificación: aceptación por API 20/20 + e2e 9/9. `docker compose up` levanta todo desde cero (migra + siembra).
- Único ⏳ opcional: `AgentAvailabilityLog` (historial), que nunca fue requerido.
