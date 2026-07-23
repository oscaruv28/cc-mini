# Guía de prueba — recorrido completo del sistema

Acciones para validar el sistema tal como lo pide la prueba. Cada paso indica el
**resultado esperado** y el **requisito** que cubre.

Accesos: **Portal** http://localhost:8080 · **API** http://localhost:3000/api · **Swagger** http://localhost:3000/api/docs
Credenciales: `admin@demo.co` / `admin123` (ADMIN) · `agente@demo.co` / `agente123` (AGENT).

---

## 0. Levantar el sistema
1. `docker compose up --build`
   → Levanta Postgres + backend + frontend; la BD se **restaura desde un backup** con datos de ejemplo. *(Entregable: arranca con un comando)*

## 1. Pruebas automáticas (opcional pero recomendado)
2. `node scripts/verify.mjs` → 20/20: requisitos por API + masivo + **correctitud de métricas vs BD**.
3. `bash scripts/test-e2e.sh` → 9/9: e2e con BD aislada y seed determinista. *(Tests y DX)*

## 2. Login y roles
4. Entra a `:8080` con **admin** → cae en **Dashboard**. *(rutas por rol)*
5. Cierra sesión, entra con **agente** → cae en **Mi workspace**.
6. Prueba una contraseña mala → **error visible** (401). *(manejo de errores)*

## 3. Flujo del AGENTE (llamadas)
7. En el workspace, cambia tu **disponibilidad** (Disponible/En pausa…). *(disponibilidad del agente)*
8. **Simular llamada**: pon `10` y dale Simular → aparecen 10 llamadas en tu lista. *(crear interacción)*
9. En una llamada **OPEN**, pulsa `→ IN_PROGRESS`, luego `→ RESOLVED` → el estado avanza y se registra el cierre. *(A2: estados + timestamp de cierre)*
10. **Tipifica** una llamada (selector de tipificación). *(tipificación)*
11. Usa los **filtros** (estado, tipo) y la **paginación**. *(A3: filtros + paginación)*
    → El agente **solo ve llamadas**, no tickets.

## 4. Flujo del ADMIN
12. **Tickets** → *Abrir ticket*: asunto + agente asignado + prioridad → se crea (OPEN) y aparece en la lista. *(el admin genera tickets; A1)*
13. En un ticket, avanza estado / edita tipificación (el admin gestiona los tickets end-to-end).
14. **Interacciones** → lista global con filtros por **agente / estado / tipo / rango** + paginación. *(A3)*
15. **Agentes** → crea un usuario (agente/admin) de tu organización; elimínalo. *(administración de agentes)*

## 5. Núcleo: métricas + zona horaria
16. **Dashboard** → elige un rango de fechas (p. ej. 2026-07-01 a 2026-07-31).
    → Tabla **por agente**: total, resueltas, **tasa** y **tiempo promedio de resolución**. *(B1)*
    → Gráfico de **volumen por día**. *(B2)*
17. Verifica **eficiencia/correctitud**: `node scripts/verify.mjs` compara la API contra la BD con miles de registros. *(B3)*
18. Verifica **zona horaria (UTC-5)**: en los e2e hay una prueba de frontera — una llamada de las **8 p.m. en Cali** cuenta en **ese** día, no el siguiente. *(B4)*
    - Manual (Swagger): crea una llamada con `openedAt` = `2026-07-10T20:00:00-05:00`, resuélvela, y en el dashboard con rango 10–11 de julio verás que suma al **día 10**.

## 6. Manejo de errores (no asumir camino feliz)
19. Cambiar estado saltando pasos (OPEN → RESOLVED) → **409** (en Swagger o probando el flujo). *(A2)*
20. Crear interacción con un agente inexistente → **400**.
21. Llamar cualquier endpoint sin token → **401**.

## 7. Aislamiento por empresa (multi-tenant)
22. Todo lo que ve un admin/agente es **solo de su organización** (`Customer`). Un usuario de otra empresa no ve interacciones, métricas ni usuarios ajenos. *(diseño)*

## 8. Endpoints por API (Swagger)
23. Abre `/api/docs`, pulsa **Authorize**, pega el token del login y prueba:
    - `POST /calls/simulate`, `PATCH /calls/:id/status`, `PATCH /calls/:id/disposition`
    - `POST /tickets`, `PATCH /tickets/:id/status`; `GET /calls`, `GET /tickets`
    - `GET /metrics?from&to`, `GET /interactions?...` (timeline combinado)
    - `GET /roles`, `/customers`, `/dispositions`, `/agent-availabilities`
    - CRUD `/users` (+ `/:id/availability`)

---

### Mapa requisito → dónde se prueba
| Requisito | Pasos |
|---|---|
| Crear interacción (llamada/ticket) + apertura | 8, 12 |
| Estados abierta→en_progreso→resuelta + cierre | 9, 19 |
| Listar con filtros + paginación | 11, 14 |
| Métricas por agente (total/resueltas/tasa/tiempo) | 16 |
| Volumen por día | 16 |
| Agregación eficiente | 17 |
| Zona horaria UTC-5 | 18 |
| Errores / entradas inválidas | 6, 19, 20, 21 |
| Interfaz mínima (listar + métricas, carga/error) | 11, 14, 16 |
| Seed de datos | 0 |
