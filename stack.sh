#!/usr/bin/env bash
set -euo pipefail

# Absolute paths so nothing depends on the caller's CWD
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD="${ROOT_DIR}/docker-compose.yml"
DB="${ROOT_DIR}/db/docker-compose.yml"
ROOT_ENV="${ROOT_DIR}/.env"
DB_ENV="${ROOT_DIR}/db/.env"

cmd="${1:-up}"

compose_cmd=( docker compose )

# Load env files if they exist (order matters: DB first, then ROOT to override)
[ -f "$DB_ENV" ]   && compose_cmd+=( --env-file "$DB_ENV" )
[ -f "$ROOT_ENV" ] && compose_cmd+=( --env-file "$ROOT_ENV" )

# IMPORTANT: root compose FIRST so project dir = repo root
compose_cmd+=( -f "$PROD" -f "$DB" )

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



##!/usr/bin/env bash
#set -euo pipefail
#
#DB="db/docker-compose.yml"
#PROD="docker-compose.yml"
#
#cmd="${1:-up}"
#
#compose_cmd=(
#  docker compose
#  --env-file db/.env
#  --env-file .env
#  -f "$DB"
#  -f "$PROD"
#)
#
#case "$cmd" in
#  up)       "${compose_cmd[@]}" up -d ;;
#  down)     "${compose_cmd[@]}" down -v ;;
#  logs)     "${compose_cmd[@]}" logs -f ;;
#  ps)       "${compose_cmd[@]}" ps ;;
#  restart)  "${compose_cmd[@]}" restart ;;
#  pull)     "${compose_cmd[@]}" pull ;;
#  *)
#    echo "Usage: $0 {up|down|logs|ps|restart|pull}"
#    exit 1 ;;
#esac


##!/usr/bin/env bash
#set -euo pipefail
#
#ROOT="docker-compose.yml"
#DB="db/docker-compose.yml"
#
#cmd="${1:-up}"
#
#compose_cmd=(
#  docker compose
#  --env-file db/.env
#  --env-file .env
#  -f "$DB"
#  -f "$ROOT"
#)
#
#case "$cmd" in
#  up)
#    "${compose_cmd[@]}" up -d --build
#    ;;
#  down)
#    "${compose_cmd[@]}" down -v
#    ;;
#  logs)
#    "${compose_cmd[@]}" logs -f
#    ;;
#  ps)
#    "${compose_cmd[@]}" ps
#    ;;
#  restart)
#    "${compose_cmd[@]}" restart
#    ;;
#  *)
#    echo "Usage: $0 {up|down|logs|ps|restart}"
#    exit 1
#    ;;
#esac
