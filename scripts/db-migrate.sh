#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

cd "${ROOT_DIR}"
PYTHON_BIN="${ROOT_DIR}/.venv/bin/python"
if [[ ! -x "${PYTHON_BIN}" ]]; then
  PYTHON_BIN="python3"
fi

"${PYTHON_BIN}" - <<'PY'
from __future__ import annotations

import os
from pathlib import Path

import psycopg


database_url = os.getenv("DATABASE_URL", "").strip()
if not database_url:
    raise SystemExit("DATABASE_URL is required")

root = Path.cwd()
migrations = sorted((root / "infra" / "sql" / "migrations").glob("*.up.sql"))
if not migrations:
    raise SystemExit("No migration files found")


def looks_applied(cur: psycopg.Cursor[tuple], migration_name: str) -> bool:
    if migration_name == "001_domain_core.up.sql":
        cur.execute(
            """
            select count(*) from information_schema.tables
            where table_schema='public'
              and table_name in (
                'study','study_plan','study_plan_version','approval_gate',
                'study_run','run_step','artifact'
              )
            """
        )
        return int(cur.fetchone()[0]) == 7
    if migration_name == "002_artifact_types.up.sql":
        cur.execute(
            """
            select pg_get_constraintdef(oid)
            from pg_constraint
            where conname = 'artifact_artifact_type_check'
            """
        )
        row = cur.fetchone()
        return bool(row and "qual_transcript" in (row[0] or ""))
    if migration_name == "003_mvp_asset_catalog.up.sql":
        cur.execute(
            """
            select count(*) from information_schema.tables
            where table_schema='public'
              and table_name in (
                'target_audience','persona_profile','asset_manifest',
                'ingestion_job','dataset_schema_mapping','stimulus'
              )
            """
        )
        return int(cur.fetchone()[0]) == 6
    return False


with psycopg.connect(database_url) as conn:
    with conn.cursor() as cur:
        cur.execute(
            """
            create table if not exists schema_migration (
              name text primary key,
              applied_at timestamptz not null default now()
            )
            """
        )
        cur.execute("select name from schema_migration")
        applied = {row[0] for row in cur.fetchall()}
        for path in migrations:
            if path.name in applied:
                print(f"SKIP {path.name}")
                continue
            if looks_applied(cur, path.name):
                print(f"REGISTER {path.name}")
                cur.execute("insert into schema_migration (name) values (%s) on conflict do nothing", (path.name,))
                continue
            sql = path.read_text(encoding="utf-8").strip()
            if not sql:
                continue
            print(f"APPLY {path.name}")
            cur.execute(sql)
            cur.execute("insert into schema_migration (name) values (%s) on conflict do nothing", (path.name,))
    conn.commit()

print(f"APPLIED {len(migrations)} migrations")
PY
