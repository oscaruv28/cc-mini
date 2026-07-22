# syntax=docker/dockerfile:1

# --- Etapa build: instala todas las deps y compila TS -> dist ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Etapa runtime: solo deps de producción + dist ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Zona horaria del contenedor (la agregación por día se resuelve igual en SQL,
# pero deja el contenedor consistente con la operación).
ENV TZ=America/Bogota

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 3000
# En la etapa de migraciones/seed se añadirá un entrypoint que ejecute
# migration:up + seed antes de arrancar, para que `docker compose up` deje
# datos listos. Por ahora arranca la API.
CMD ["node", "dist/main.js"]
