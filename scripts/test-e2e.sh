#!/usr/bin/env bash
# Pruebas de integración e2e contra una BD de test aislada.
#   bash scripts/test-e2e.sh
set -e

echo "▶ Levantando Postgres…"
docker compose up -d db
until docker exec cc-mini-db-1 pg_isready -U cc_mini >/dev/null 2>&1; do sleep 1; done

echo "▶ Recreando cc_mini_test…"
docker exec cc-mini-db-1 psql -U cc_mini -d postgres -c "drop database if exists cc_mini_test;" >/dev/null
docker exec cc-mini-db-1 psql -U cc_mini -d postgres -c "create database cc_mini_test;" >/dev/null

cd "$(dirname "$0")/../backend"
echo "▶ Migrando cc_mini_test…"
DB_NAME=cc_mini_test DB_PORT=5433 npm run migration:up

echo "▶ Ejecutando e2e…"
DB_NAME=cc_mini_test DB_PORT=5433 NODE_ENV=production npm run test:e2e
