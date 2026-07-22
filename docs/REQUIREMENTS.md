# Requisitos del backend — criterios de aceptación

Derivados del enunciado de la prueba. Es la lista bajo la cual se evalúa el
**funcionamiento** del backend. Estado real y forma de verificación.

Leyenda: ✅ cumplido · 🔄 parcial · ⏳ pendiente
Verificación reproducible: `node scripts/verify.mjs` (con la app y la BD arriba).

---

## A. Gestión de interacciones (must-have)

| ID | Requisito | Estado | Verificación |
|----|-----------|--------|--------------|
| A1 | Crear una interacción (tipo **llamada** o **ticket**), asignada a un agente, con timestamp de apertura | ✅ | `POST /interactions/{calls,tickets}` → 201, `status=OPEN`, `openedAt` · verify REQ1 |
| A2 | Cambiar estado `abierta → en_progreso → resuelta`; al resolver, registrar timestamp de cierre | ✅ | `PATCH .../:id/status` transiciones válidas + `closedAt`; inválidas → 409 · verify REQ2 |
| A3 | Listar interacciones con filtros (agente, estado, rango de fechas) y paginación | ✅ | `GET /interactions?agentId&status&type&from&to&page&limit` · verify REQ3 |

## B. Métricas — núcleo (aquí miran de cerca)

| ID | Requisito | Estado | Verificación |
|----|-----------|--------|--------------|
| B1 | Por agente en un rango: **total**, **resueltas**, **tasa de resolución**, **tiempo promedio de resolución** (cierre − apertura) | ✅ | `GET /metrics?from&to` → `perAgent[]` · verify REQ4 |
| B2 | **Serie de volumen por día** dentro del rango | ✅ | `metrics.dailyVolume[]` |
| B3 | Agregación **correcta y eficiente** con muchos registros (no traer todo a memoria) | ✅ | Agregación en SQL sobre `v_interaction`; correctitud API == BD con ~5k registros · verify |
| B4 | Agrupamiento "por día" respeta **UTC-5**, no la zona del servidor | ✅ | `AT TIME ZONE`; prueba de frontera (8pm Cali cuenta en su día) |

## C. Técnicos / no funcionales

| ID | Requisito | Estado | Nota |
|----|-----------|--------|------|
| C1 | Backend en Node; stack (framework, lenguaje, DB, ORM) justificado | ✅ | TS+NestJS+MikroORM+PostgreSQL · DECISIONS §1 |
| C2 | Modelo de datos pensado en **cómo se consulta** | ✅ | Índices `(agent_id, opened_at)`/`(opened_at)`/`(status)`, vista `v_interaction` · DECISIONS §2 |
| C3 | **Script o seed** que cargue datos de ejemplo (cientos de interacciones, varios agentes, fechas que cruzan medianoche) | ⏳ | Hoy se puebla vía `simulate`/SQL; **falta el comando único `npm run seed`** |
| C4 | Manejo de **errores y entradas inválidas** explícito (no asumir camino feliz) | ✅ | 400 (datos inválidos), 401 (sin token), 404 (no existe), 409 (transición inválida) |

## D. Entregables

| ID | Requisito | Estado | Nota |
|----|-----------|--------|------|
| D1 | Repositorio Git con código + instrucciones para levantarlo + seed | 🔄 | Repo y commits ✅; faltan README/seed/entrypoint |
| D2 | `DECISIONS.md` (arquitectura, modelo, métricas, trade-offs, uso de IA, qué haría distinto) | 🔄 | §1–§3 listas; faltan **uso de IA** y **qué haría distinto** |
| D3 | `README` (instalar, levantar, probar, endpoints) | ⏳ | Hay README inicial; falta completarlo |

---

## Cómo lo evalúan (pesos del enunciado)

| Criterio | Qué miran | Peso |
|----------|-----------|------|
| Arquitectura | Separación de responsabilidades, claridad, dónde vive cada cosa | 25 |
| Calidad de código | Legibilidad, nombres, manejo de errores, consistencia | 20 |
| Núcleo: métricas | Agregación correcta y eficiente, zona horaria, casos borde | 20 |
| API y modelo de datos | Diseño de endpoints, modelado del dominio, filtros y paginación | 15 |
| Documento de decisiones | Razonamiento, trade-offs honestos, uso reflexivo de IA | 15 |
| Tests y DX | Pruebas donde aportan, README claro, facilidad para levantarlo | 5 |

---

## Resumen de estado

- **Funcionalidad núcleo (A + B):** ✅ completa y verificada (20/20 en `verify.mjs`).
- **No funcionales (C):** ✅ salvo el **seed formal** (C3).
- **Entregables (D):** 🔄 faltan **README**, **seed** y completar **DECISIONS** (uso de IA / qué haría distinto).
- **Extras implementados** (no exigidos, suman a arquitectura/dominio): auth JWT, CRUD de usuarios, simulación de llamadas, tipificación, catálogos, disponibilidad del agente.
