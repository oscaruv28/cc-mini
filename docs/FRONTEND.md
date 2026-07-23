# Frontend — arquitectura y plan

SPA tipo **portal por rol** que consume la API del backend.

## Stack
- **React + Vite + TypeScript** (SPA).
- **Tailwind CSS v4** (plugin de Vite) para estilos.
- **axios** como cliente HTTP, centralizado en un **gateway**.
- **react-router-dom** para el ruteo con guards por rol.

## Organización por módulos
```
frontend/src/
├── api/                # GATEWAY: un solo cliente axios + endpoints por dominio
│   ├── client.ts       # instancia axios: baseURL, inyecta Bearer, maneja 401
│   ├── auth.api.ts     # login
│   ├── interactions.api.ts
│   ├── users.api.ts
│   ├── metrics.api.ts
│   └── catalog.api.ts  # roles, customers, dispositions, agent-availabilities
├── modules/
│   ├── auth/           # login + contexto de sesión
│   ├── agent/          # PORTAL DEL AGENTE: workspace de llamadas
│   └── admin/          # PORTAL DEL ADMIN: dashboard + administración de agentes
├── components/         # UI reutilizable (Button, Input, Table, Card, Spinner, ErrorState, Badge...)
├── hooks/              # useAuth, useAsync (carga/error), etc.
├── utils/              # formato de fechas/duración, constantes
├── router/             # rutas + guard por rol
├── App.tsx
└── main.tsx
```

## Portal por rol
- **AGENT** → *Workspace de llamadas*: botón **Simular llamada**, lista de sus interacciones con filtros, cambiar estado, tipificar, y cambiar su **disponibilidad**.
- **ADMIN** → *Dashboard* (métricas: tabla por agente + gráfico de volumen por día, selector de rango) y **Administración de agentes** (CRUD de usuarios de su `Customer`/organización) + vista global de interacciones.

## Buenas prácticas aplicadas
- Gateway único (no `fetch` regado): baseURL por env, Bearer automático, manejo central de 401 (logout).
- Separación por módulos y por responsabilidad (api / hooks / components / utils).
- Estados de **carga** y **error** explícitos en cada consumo (hook `useAsync`).
- Tipos TS compartidos con la forma de la API.

## Checklist (must-have del enunciado + portal)
- [x] Login (guarda JWT, lo adjunta, rutas protegidas por rol)
- [x] Vista de interacciones con filtros (agente, estado, tipo, rango) + paginación
- [x] Estados de carga y error explícitos (hook `useAsync` + `Spinner`/`ErrorState`)
- [x] Vista de métricas (tabla por agente + gráfico de volumen por día)
- [x] Workspace del agente: simular llamada, cambiar estado, tipificar, disponibilidad
- [x] Admin: administración de agentes (CRUD) del customer
- [x] Servicio `frontend` en docker-compose (nginx) + integración

---

# Cómo funciona (para entenderlo)

## El mapa mental: 4 capas
```
1. Arranque      main.tsx → App.tsx (providers) → AppRouter (rutas)
2. Gateway       src/api/   ← ÚNICO que habla con el backend (axios)
3. Hooks         src/hooks/ ← lógica reutilizable (useAuth, useAsync)
4. Vistas        src/modules/ + src/components/ ← lo que se ve
```
Regla de oro: **los componentes nunca llaman axios directo**; siempre pasan por un
servicio del gateway (`src/api/*`), y casi siempre a través de `useAsync`.

## Flujo de UNA petición (paso a paso)
Ejemplo: el dashboard carga métricas.
```
1. DashboardPage se monta.
2. Llama  useAsync(() => metricsApi.get({from,to}), [from,to])
3. useAsync pone loading=true y ejecuta la función.
4. metricsApi.get  →  api.get('/metrics', { params })          (src/api/metrics.api.ts)
5. El interceptor de axios agrega  Authorization: Bearer <token> (src/api/client.ts)
6. El backend responde; axios devuelve response.data.
7. useAsync guarda data, loading=false (o error si falló).
8. DashboardPage renderiza: <Spinner/> si loading, <ErrorState/> si error, o la tabla.
```
Si el backend responde **401**, el interceptor borra la sesión y redirige a `/login`.
Así, "manejar carga y error" no se repite en cada vista: lo centraliza `useAsync`.

## Cómo se "setea la sesión" (login)
```
1. LoginPage: formulario → useAuth.login(email, password)          (src/modules/auth)
2. useAuth.login → authApi.login → POST /auth/login → { access_token, user }
3. Guarda token + user en localStorage (session) y en el contexto (useAuth).
4. navigate según user.role → /dashboard (ADMIN) o /agent (AGENT).
5. Desde ahí, CADA petición lleva el token (lo pone el interceptor).
```
`useAuth` es un **Context**: cualquier componente hace `const { user, logout } = useAuth()`.

## Ruteo y protección por rol (dónde vive el `Outlet`)
```
<App>
 └─ <AuthProvider>            ← provee la sesión a todo el árbol
     └─ <BrowserRouter>
         └─ <AppRouter>       ← define las rutas
             ├─ /login                → <LoginPage/>            (pública)
             └─ "/"  → <Protected>    ← si no hay sesión → /login
                        └─ <AppLayout> ← header + nav; contiene <Outlet/>
                            ├─ index        → redirige por rol
                            ├─ /agent       → <AgentWorkspace/>
                            ├─ /dashboard   → <RequireRole ADMIN><DashboardPage/></>
                            ├─ /interactions, /tickets, /agents (ADMIN)
```
- `Protected` renderiza `AppLayout`; `AppLayout` tiene el **`<Outlet/>`** donde se pintan
  las páginas hijas → comparten header/nav sin repetirlo.
- `RequireRole` bloquea rutas de admin; `HomeRedirect` enruta según el rol.

## Qué hay en cada carpeta
| Carpeta | Qué contiene |
|---|---|
| `src/api/` | **Gateway** `client.ts` (axios + Bearer + 401) + un servicio por dominio (`auth`, `interactions`, `users`, `metrics`, `catalog`). |
| `src/hooks/` | `useAuth` (sesión/Context) y `useAsync` (carga/error/reload). |
| `src/components/` | UI reutilizable (`ui.tsx`: Button, Input, Card, Badge, Spinner, ErrorState…), `AppLayout`, e **`InteractionsPanel`** (la tabla compartida). |
| `src/modules/auth` | `LoginPage`. |
| `src/modules/agent` | `AgentWorkspace` (softphone + disponibilidad + equipo + mis llamadas), `Softphone`. |
| `src/modules/admin` | `DashboardPage`, `InteractionsPage`, `TicketsPage`, `AgentsAdminPage`. |
| `src/utils/` | Formateo (fechas en UTC-5, duración, %). |
| `src/types.ts` | Los "shapes" (interfaces) que devuelve la API. |

## Las 3 piezas que si entiendes, entiendes todo
1. **`api/client.ts` (gateway):** una instancia de axios con `baseURL` + interceptores
   (Bearer automático, 401 → logout). **Todo** pasa por aquí.
2. **`hooks/useAsync.ts`:** el patrón carga/error que se repite en cada vista. Le pasas
   una función que devuelve una promesa y te da `{ data, loading, error, reload }`.
3. **`components/InteractionsPanel.tsx`:** la tabla compartida (llamadas y tickets). Se
   adapta con props: `lockedAgentId` (fija un agente), `lockedType` (CALL/TICKET),
   `allowStatusChange` (avanzar estado), `from/to` (rango), `onSelect` (botón "Ver").
   La usan el workspace del agente, Interacciones, Tickets y el drill-down del dashboard.

## Cómo seguir el código para una pantalla
Toma cualquier vista (ej. `DashboardPage`) y lee de arriba a abajo:
1. Los `useAsync(...)` de arriba → **qué datos pide** (y a qué servicio del gateway).
2. Los `useState` → **qué estado local** maneja (rango, agente seleccionado…).
3. El `return (...)` → **cómo lo pinta** (y cómo llama a las acciones de los servicios).
Ese patrón —pedir datos con `useAsync`, guardar estado con `useState`, renderizar— se
repite en **todas** las vistas.
