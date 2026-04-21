"""Shared failure handling for study runs."""

from __future__ import annotations

import logging
import os

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json

logger = logging.getLogger(__name__)


def mark_run_failed(
    *,
    study_id: str,
    run_id: str,
    error_message: str,
    database_url: str | None = None,
) -> None:
    target_database_url = (database_url or os.environ.get("DATABASE_URL", "")).strip()
    if not target_database_url:
        logger.warning("mark_run_failed_skipped run=%s reason=no_database_url", run_id)
        return

    try:
        with psycopg.connect(target_database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                resolved_study_id = study_id
                if not resolved_study_id:
                    cur.execute("SELECT study_id FROM study_run WHERE id = %s", (run_id,))
                    row = cur.fetchone()
                    resolved_study_id = str(row["study_id"]) if row else ""
                cur.execute(
                    """
                    UPDATE study_run
                    SET status='failed', ended_at=now(), updated_at=now()
                    WHERE id=%s
                    """,
                    (run_id,),
                )
                if resolved_study_id:
                    cur.execute(
                        """
                        UPDATE study
                        SET status='planning',
                            updated_at=now()
                        WHERE id=%s
                        """,
                        (resolved_study_id,),
                    )
                    cur.execute(
                        """
                        INSERT INTO study_message (study_id, role, content, message_type, metadata_json)
                        VALUES (%s, 'agent', %s, 'error', %s)
                        """,
                        (resolved_study_id, f"研究执行出错：{error_message[:200]}。请检查日志或重新开始。", Json({})),
                    )
            conn.commit()
    except Exception:
        logger.exception("mark_run_failed_error run=%s", run_id)
