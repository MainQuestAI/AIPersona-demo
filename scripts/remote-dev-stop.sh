#!/usr/bin/env bash
set -euo pipefail

PORTS=("$@")

if [[ ${#PORTS[@]} -eq 0 ]]; then
  PORTS=(15432 12375 7233 8233)
fi

kill_port_listener() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN -n -P || true)"
  if [[ -n "${pids}" ]]; then
    echo "关闭本地端口 ${port} 的 SSH 隧道: ${pids}"
    kill ${pids}
  else
    echo "本地端口 ${port} 上没有发现需要关闭的监听进程。"
  fi
}

for port in "${PORTS[@]}"; do
  kill_port_listener "${port}"
done
