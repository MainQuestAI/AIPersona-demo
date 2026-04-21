FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /workspace

RUN apt-get update \
    && apt-get install -y --no-install-recommends bash \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api/pyproject.toml apps/api/pyproject.toml
COPY apps/worker/pyproject.toml apps/worker/pyproject.toml
COPY apps/mcp/pyproject.toml apps/mcp/pyproject.toml
COPY apps/api/src apps/api/src
COPY apps/worker/src apps/worker/src
COPY apps/mcp/src apps/mcp/src

RUN python -m pip install --upgrade pip \
    && pip install -e apps/api -e apps/worker -e apps/mcp python-dotenv
