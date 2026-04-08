#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")

DOCKER_API = os.getenv("REMOTE_DOCKER_API", "http://127.0.0.1:12375").rstrip("/")
CONTAINER_NAME = os.getenv("REMOTE_TEMPORAL_CONTAINER_NAME", "aipersona-temporal-dev")
IMAGE = os.getenv("REMOTE_TEMPORAL_IMAGE", "temporalio/temporal:latest")
TEMPORAL_PORT = os.getenv("REMOTE_TEMPORAL_LOCAL_PORT", "7233")
TEMPORAL_UI_PORT = os.getenv("REMOTE_TEMPORAL_UI_LOCAL_PORT", "8233")
API_VERSION = requests.get(f"{DOCKER_API}/version", timeout=30).json()["ApiVersion"]
DOCKER_API_PREFIX = f"{DOCKER_API}/v{API_VERSION}"


def request(method: str, path: str, **kwargs):
    response = requests.request(method, f"{DOCKER_API_PREFIX}{path}", timeout=120, **kwargs)
    response.raise_for_status()
    return response


def get_container():
    filters = json.dumps({"name": [CONTAINER_NAME]})
    containers = request("GET", "/containers/json", params={"all": 1, "filters": filters}).json()
    return containers[0] if containers else None


def pull_image() -> None:
    image_name, image_tag = IMAGE.split(":", 1)
    response = request(
        "POST",
        "/images/create",
        params={"fromImage": image_name, "tag": image_tag},
        stream=True,
    )
    for _ in response.iter_lines():
        pass


def ensure_container() -> str:
    container = get_container()
    if container:
        return container["Id"]

    payload = {
        "Image": IMAGE,
        "Cmd": ["server", "start-dev", "--ip", "0.0.0.0"],
        "ExposedPorts": {"7233/tcp": {}, "8233/tcp": {}},
        "HostConfig": {
            "PortBindings": {
                "7233/tcp": [{"HostIp": "127.0.0.1", "HostPort": TEMPORAL_PORT}],
                "8233/tcp": [{"HostIp": "127.0.0.1", "HostPort": TEMPORAL_UI_PORT}],
            },
            "RestartPolicy": {"Name": "unless-stopped"},
        },
    }
    response = request("POST", "/containers/create", params={"name": CONTAINER_NAME}, json=payload)
    return response.json()["Id"]


def start_container(container_id: str) -> None:
    response = requests.post(f"{DOCKER_API_PREFIX}/containers/{container_id}/start", timeout=120)
    if response.status_code not in {204, 304}:
        response.raise_for_status()


def wait_until_ready() -> None:
    deadline = time.time() + 60
    while time.time() < deadline:
        try:
            requests.get(f"http://127.0.0.1:{TEMPORAL_UI_PORT}", timeout=1)
            print(f"TEMPORAL_READY 127.0.0.1:{TEMPORAL_PORT}")
            return
        except Exception:
            time.sleep(1)

    raise RuntimeError("Temporal 容器已启动，但本地 UI 隧道仍未就绪。请先执行 pnpm run remote:bootstrap。")


def main() -> None:
    pull_image()
    container_id = ensure_container()
    start_container(container_id)
    wait_until_ready()
    print(f"CONTAINER_NAME {CONTAINER_NAME}")
    print(f"TEMPORAL_UI http://127.0.0.1:{TEMPORAL_UI_PORT}")


if __name__ == "__main__":
    main()
