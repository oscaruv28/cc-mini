# syntax=docker/dockerfile:1

# --- build: compila la SPA con Vite ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Raíz de la API embebida en build (Vite inyecta VITE_* en tiempo de build).
# En prod usamos '/api' (mismo origen, nginx hace proxy al backend).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- runtime: sirve estáticos con nginx + proxy /api -> backend ---
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
