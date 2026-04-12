"""Entry points for starting and resuming research graph execution."""

from __future__ import annotations

import logging
import os
from typing import Any

from worker.graph.builder import compile_graph

logger = logging.getLogger(__name__)


def _get_checkpointer() -> Any:
    """Create a PostgresSaver checkpointer if available, else None."""
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        logger.warning("DATABASE_URL not set, running without checkpointer")
        return None

    try:
        from langgraph.checkpoint.postgres import PostgresSaver
        checkpointer = PostgresSaver.from_conn_string(database_url)
        checkpointer.setup()
        return checkpointer
    except ImportError:
        logger.warning("langgraph-checkpoint-postgres not installed, running without checkpointer")
        return None
    except Exception as exc:
        logger.warning("Failed to create checkpointer: %s", exc)
        return None


def start_research(study_id: str, run_id: str) -> None:
    """Start a new research graph execution.

    Called from the gateway when user confirms a plan.
    Runs synchronously (intended to be called in a background thread).
    """
    logger.info("langgraph_start study=%s run=%s", study_id, run_id)

    checkpointer = _get_checkpointer()
    if checkpointer is None:
        error_msg = "Cannot start research without checkpointer (DATABASE_URL required for LangGraph persistence)"
        logger.error(error_msg)
        try:
            from worker.graph.nodes import _post_message
            _post_message(study_id, "agent", f"研究启动失败：{error_msg}", message_type="error")
        except Exception:
            pass
        return

    graph = compile_graph(checkpointer=checkpointer)

    initial_state = {
        "study_id": study_id,
        "run_id": run_id,
    }

    config = {"configurable": {"thread_id": f"research-{run_id}"}}

    try:
        graph.invoke(initial_state, config=config)
        logger.info("langgraph_completed study=%s run=%s", study_id, run_id)
    except Exception as exc:
        logger.exception("langgraph_failed study=%s run=%s error=%s", study_id, run_id, exc)
        # Post error message to frontend
        try:
            from worker.graph.nodes import _post_message
            _post_message(
                study_id, "agent",
                f"研究执行出错：{type(exc).__name__}。请检查日志或重新开始。",
                message_type="error",
            )
        except Exception:
            pass


def resume_research(
    run_id: str,
    approved_by: str | None = None,
    decision_comment: str | None = None,
) -> None:
    """Resume a paused research graph (after human review).

    Called from the gateway when user approves midrun review.
    Runs synchronously (intended to be called in a background thread).
    """
    logger.info("langgraph_resume run=%s approved_by=%s", run_id, approved_by)

    checkpointer = _get_checkpointer()
    if checkpointer is None:
        logger.error("Cannot resume without checkpointer — graph state is lost")
        return

    graph = compile_graph(checkpointer=checkpointer)
    config = {"configurable": {"thread_id": f"research-{run_id}"}}

    try:
        from langgraph.types import Command

        # Resume from interrupt, passing human decision to the interrupt() call
        graph.invoke(
            Command(resume={
                "action": "continue",
                "approved_by": approved_by or "user",
                "decision_comment": decision_comment or "",
            }),
            config=config,
        )
        logger.info("langgraph_resume_completed run=%s", run_id)
    except Exception as exc:
        logger.exception("langgraph_resume_failed run=%s error=%s", run_id, exc)
