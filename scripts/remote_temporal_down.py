#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from pathlib import Path

import requests
from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")

DOCKER_API = os.getenv("REMOTE_DOCKER_API", "http://127.0.0.1:12375").rstrip("/")
CONTAINER_NAME = os.getenv("REMOTE_TEMPORAL_CONTAINER_NAME", "aipersona-temporal-dev")
API_VERSION = requests.get(f"{DOCKER_API}/version", timeout=30).json()["ApiVersion"]
DOCKER_API_PREFIX = f"{DOCKER_API}/v{API_VERSION}"


def main() -> None:
    filters = json.dumps({"name": [CONTAINER_NAME]})
    response = requests.get(
        f"{DOCKER_API_PREFIX}/containers/json",
        params={"all": 1, "filters": filters},
        timeout=30,
    )
    response.raise_for_status()
    containers = response.json()
    if not containers:
        print("NOT_FOUND")
        return

    container_id = containers[0]["Id"]
    stop_response = requests.post(f"{DOCKER_API_PREFIX}/containers/{container_id}/stop", timeout=60)
    if stop_response.status_code not in {204, 304}:
        stop_response.raise_for_status()
    print(f"STOPPED {CONTAINER_NAME}")


if __name__ == "__main__":
    main()
