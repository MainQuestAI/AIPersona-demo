#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-${ROOT_DIR}/.env.compose}"
ENV_TEMPLATE_FILE="${ENV_TEMPLATE_FILE:-${ROOT_DIR}/.env.compose.example}"
COMPOSE_FILE="${COMPOSE_FILE:-${ROOT_DIR}/docker-compose.yml}"

if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 docker。请先安装并启动 Docker Desktop（或兼容的 Docker Engine）。" >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "缺少本地 Docker 环境文件：${ENV_FILE}" >&2
  echo "请先执行：cp ${ENV_TEMPLATE_FILE} ${ENV_FILE}" >&2
  exit 1
fi

exec docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
