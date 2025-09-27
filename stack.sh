#!/usr/bin/env bash
set -euo pipefail

DB="db/docker-compose.yml"
PROD="docker-compose.prod.yml"

cmd="${1:-up}"

compose_cmd=(
  docker compose
  --env-file db/.env
  --env-file .env
  -f "$DB"
  -f "$PROD"
)

case "$cmd" in
  up)       "${compose_cmd[@]}" up -d ;;
  down)     "${compose_cmd[@]}" down -v ;;
  logs)     "${compose_cmd[@]}" logs -f ;;
  ps)       "${compose_cmd[@]}" ps ;;
  restart)  "${compose_cmd[@]}" restart ;;
  pull)     "${compose_cmd[@]}" pull ;;
  *)
    echo "Usage: $0 {up|down|logs|ps|restart|pull}"
    exit 1 ;;
esac
