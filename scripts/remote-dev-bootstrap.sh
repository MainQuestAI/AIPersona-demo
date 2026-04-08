#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "${ROOT_DIR}/.env" ]]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
fi

DEV_SERVER_IP="${DEV_SERVER_IP:-100.75.231.2}"
DEV_SERVER_SSH_USER="${DEV_SERVER_SSH_USER:-dingcheng}"
DEV_SERVER_SSH_KEY_PATH="${DEV_SERVER_SSH_KEY_PATH:-$HOME/.ssh/id_ed25519_deploy}"
REMOTE_DB_LOCAL_PORT="${REMOTE_DB_LOCAL_PORT:-15432}"
REMOTE_DOCKER_LOCAL_PORT="${REMOTE_DOCKER_LOCAL_PORT:-12375}"
REMOTE_TEMPORAL_LOCAL_PORT="${REMOTE_TEMPORAL_LOCAL_PORT:-7233}"
REMOTE_TEMPORAL_UI_LOCAL_PORT="${REMOTE_TEMPORAL_UI_LOCAL_PORT:-8233}"
POSTGRES_DB="${POSTGRES_DB:-}"
POSTGRES_USER="${POSTGRES_USER:-}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

if [[ -z "${POSTGRES_DB}" || -z "${POSTGRES_USER}" || -z "${POSTGRES_PASSWORD}" ]]; then
  echo "缺少 PostgreSQL 凭据。请先在 .env 或 shell 环境中设置 POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD。" >&2
  exit 1
fi

if [[ ! -f "${DEV_SERVER_SSH_KEY_PATH}" ]]; then
  echo "SSH key 不存在: ${DEV_SERVER_SSH_KEY_PATH}" >&2
  exit 1
fi

ensure_local_port_ready() {
  local port="$1"
  if lsof -iTCP:"${port}" -sTCP:LISTEN -n -P >/dev/null 2>&1; then
    echo "本地端口 ${port} 已在监听，复用现有通道。"
    return 1
  fi
  return 0
}

SSH_BASE=(ssh -fN -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -i "${DEV_SERVER_SSH_KEY_PATH}" "${DEV_SERVER_SSH_USER}@${DEV_SERVER_IP}")

if ensure_local_port_ready "${REMOTE_DB_LOCAL_PORT}"; then
  echo "建立 PostgreSQL SSH 隧道: localhost:${REMOTE_DB_LOCAL_PORT} -> ${DEV_SERVER_IP}:5432"
  "${SSH_BASE[@]}" -L "${REMOTE_DB_LOCAL_PORT}:127.0.0.1:5432"
fi

if ensure_local_port_ready "${REMOTE_DOCKER_LOCAL_PORT}"; then
  echo "建立 Docker API SSH 隧道: localhost:${REMOTE_DOCKER_LOCAL_PORT} -> ${DEV_SERVER_IP}:2375"
  "${SSH_BASE[@]}" -L "${REMOTE_DOCKER_LOCAL_PORT}:127.0.0.1:2375"
fi

if ensure_local_port_ready "${REMOTE_TEMPORAL_LOCAL_PORT}"; then
  echo "建立 Temporal gRPC SSH 隧道: localhost:${REMOTE_TEMPORAL_LOCAL_PORT} -> ${DEV_SERVER_IP}:7233"
  "${SSH_BASE[@]}" -L "${REMOTE_TEMPORAL_LOCAL_PORT}:127.0.0.1:7233"
fi

if ensure_local_port_ready "${REMOTE_TEMPORAL_UI_LOCAL_PORT}"; then
  echo "建立 Temporal UI SSH 隧道: localhost:${REMOTE_TEMPORAL_UI_LOCAL_PORT} -> ${DEV_SERVER_IP}:8233"
  "${SSH_BASE[@]}" -L "${REMOTE_TEMPORAL_UI_LOCAL_PORT}:127.0.0.1:8233"
fi

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:${REMOTE_DB_LOCAL_PORT}/${POSTGRES_DB}"
DOCKER_HOST="tcp://127.0.0.1:${REMOTE_DOCKER_LOCAL_PORT}"
REMOTE_DOCKER_API="http://127.0.0.1:${REMOTE_DOCKER_LOCAL_PORT}"
TEMPORAL_ADDRESS="127.0.0.1:${REMOTE_TEMPORAL_LOCAL_PORT}"
TEMPORAL_UI_URL="http://127.0.0.1:${REMOTE_TEMPORAL_UI_LOCAL_PORT}"

cat <<EOF
远程开发隧道已建立。

建议在当前 shell 中导出以下变量：
export DATABASE_URL='${DATABASE_URL}'
export DOCKER_HOST='${DOCKER_HOST}'
export REMOTE_DOCKER_API='${REMOTE_DOCKER_API}'
export TEMPORAL_ADDRESS='${TEMPORAL_ADDRESS}'
export TEMPORAL_UI_URL='${TEMPORAL_UI_URL}'

快速检查：
nc -vz 127.0.0.1 ${REMOTE_DB_LOCAL_PORT}
curl -s ${REMOTE_DOCKER_API}/_ping || true
nc -vz 127.0.0.1 ${REMOTE_TEMPORAL_LOCAL_PORT} || true
open ${TEMPORAL_UI_URL}

关闭隧道时可使用：
${ROOT_DIR}/scripts/remote-dev-stop.sh ${REMOTE_DB_LOCAL_PORT} ${REMOTE_DOCKER_LOCAL_PORT} ${REMOTE_TEMPORAL_LOCAL_PORT} ${REMOTE_TEMPORAL_UI_LOCAL_PORT}
EOF
