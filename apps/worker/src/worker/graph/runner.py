"""Entry points for starting and resuming research graph execution."""

from __future__ import annotations

import logging
import os
from typing import Any

from worker.graph.builder import compile_graph
from worker.graph.failure import mark_run_failed

logger = logging.getLogger(__name__)


def _release_checkpointer(checkpointer: Any) -> None:
    """Close context-managed checkpointers created by newer LangGraph releases."""
    if checkpointer is None:
        return
    exit_fn = getattr(checkpointer, "_aipersona_context_exit", None)
    if not callable(exit_fn):
        return
    try:
        exit_fn(None, None, None)
    except Exception as exc:
        logger.warning("Failed to close checkpointer cleanly: %s", exc)


def _fail_run(study_id: str, run_id: str, error_msg: str, *, database_url: str | None = None) -> None:
    """Mark run as failed in DB and post error message to frontend."""
    mark_run_failed(study_id=study_id, run_id=run_id, error_message=error_msg, database_url=database_url)
    logger.info("run_marked_failed run=%s", run_id)


def _get_checkpointer(database_url: str | None = None) -> Any:
    """Create a PostgresSaver checkpointer if available, else None."""
    resolved_database_url = (database_url or os.getenv("DATABASE_URL", "")).strip()
    if not resolved_database_url:
        logger.warning("DATABASE_URL not set, running without checkpointer")
        return None

    try:
        from langgraph.checkpoint.postgres import PostgresSaver
        checkpointer = PostgresSaver.from_conn_string(resolved_database_url)
        if hasattr(checkpointer, "__enter__") and hasattr(checkpointer, "__exit__"):
            context_manager = checkpointer
            checkpointer = context_manager.__enter__()
            setattr(checkpointer, "_aipersona_context_exit", context_manager.__exit__)
        checkpointer.setup()
        return checkpointer
    except ImportError:
        logger.warning("langgraph-checkpoint-postgres not installed, running without checkpointer")
        return None
    except Exception as exc:
        logger.warning("Failed to create checkpointer: %s", exc)
        return None


def start_research(study_id: str, run_id: str, database_url: str | None = None) -> None:
    """Start a new research graph execution.

    Called from the gateway when user confirms a plan.
    Runs synchronously (intended to be called in a background thread).
    """
    logger.info("langgraph_start study=%s run=%s", study_id, run_id)

    resolved_database_url = (database_url or os.getenv("DATABASE_URL", "")).strip()
    checkpointer = _get_checkpointer(resolved_database_url)
    if checkpointer is None:
        error_msg = "Cannot start research without checkpointer (DATABASE_URL required for LangGraph persistence)"
        logger.error(error_msg)
        _fail_run(study_id, run_id, error_msg, database_url=resolved_database_url or None)
        return

    try:
        graph = compile_graph(checkpointer=checkpointer)

        initial_state = {
            "study_id": study_id,
            "run_id": run_id,
        }

        config = {"configurable": {"thread_id": f"research-{run_id}"}}

        graph.invoke(initial_state, config=config)
        logger.info("langgraph_completed study=%s run=%s", study_id, run_id)
    except Exception as exc:
        logger.exception("langgraph_failed study=%s run=%s error=%s", study_id, run_id, exc)
        _fail_run(study_id, run_id, str(exc), database_url=resolved_database_url or None)
    finally:
        _release_checkpointer(checkpointer)


def resume_research(
    run_id: str,
    approved_by: str | None = None,
    action: str = "continue",
    decision_comment: str | None = None,
    database_url: str | None = None,
) -> None:
    """Resume a paused research graph (after human review).

    Called from the gateway when user approves midrun review.
    Runs synchronously (intended to be called in a background thread).
    """
    logger.info("langgraph_resume run=%s approved_by=%s", run_id, approved_by)

    resolved_database_url = (database_url or os.getenv("DATABASE_URL", "")).strip()
    checkpointer = _get_checkpointer(resolved_database_url)
    if checkpointer is None:
        error_msg = "Cannot resume research without checkpointer (DATABASE_URL required for LangGraph persistence)"
        logger.error(error_msg)
        mark_run_failed(study_id="", run_id=run_id, error_message=error_msg, database_url=resolved_database_url or None)
        return

    try:
        graph = compile_graph(checkpointer=checkpointer)
        config = {"configurable": {"thread_id": f"research-{run_id}"}}
        from langgraph.types import Command

        # Resume from interrupt, passing human decision to the interrupt() call
        graph.invoke(
            Command(resume={
                "action": action,
                "approved_by": approved_by or "user",
                "decision_comment": decision_comment or "",
            }),
            config=config,
        )
        logger.info("langgraph_resume_completed run=%s", run_id)
    except Exception as exc:
        logger.exception("langgraph_resume_failed run=%s error=%s", run_id, exc)
        # Try to get study_id from the checkpoint state for error reporting
        try:
            state = checkpointer.get(config)
            sid = state.get("study_id", "") if state else ""
            if sid:
                _fail_run(sid, run_id, str(exc), database_url=resolved_database_url or None)
        except Exception:
            pass
    finally:
        _release_checkpointer(checkpointer)
