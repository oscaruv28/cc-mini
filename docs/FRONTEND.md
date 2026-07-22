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
- [ ] Servicio `frontend` en docker-compose (nginx) + integración
