"""Gateway for starting and resuming research workflows.

Replaces the Temporal-based gateway with LangGraph runner calls.
Graph execution runs in background threads.
"""

from __future__ import annotations

import logging
import sys
from threading import Thread
from typing import Any

logger = logging.getLogger(__name__)


class LangGraphStudyGateway:
    """Starts and resumes LangGraph research workflows via background threads."""

    def __init__(self, *, database_url: str) -> None:
        self._database_url = database_url

    def start_study_run(self, run_id: str, study_id: str, plan_version_id: str) -> dict[str, str | None]:
        """Start a legacy (non-agent) study run. Uses the same LangGraph path."""
        return self.start_agent_study_run(run_id, study_id, plan_version_id)

    def start_agent_study_run(self, run_id: str, study_id: str, plan_version_id: str) -> dict[str, str | None]:
        """Start an agent-driven research graph in a background thread."""
        workflow_id = f"langgraph-{run_id}"

        def _run() -> None:
            try:
                # Ensure worker package is importable
                import os
                worker_src = os.path.join(
                    os.path.dirname(__file__),
                    "..", "..", "..", "..", "worker", "src",
                )
                abs_path = os.path.abspath(worker_src)
                if abs_path not in sys.path:
                    sys.path.insert(0, abs_path)

                from worker.graph.runner import start_research
                start_research(study_id, run_id)
            except Exception:
                logger.exception("langgraph_start_failed run=%s", run_id)

        thread = Thread(target=_run, daemon=True, name=f"langgraph-{run_id}")
        thread.start()

        return {"workflow_id": workflow_id, "workflow_run_id": None}

    def resume_study_run(self, workflow_id: str, approved_by: str, decision_comment: str | None) -> None:
        """Resume a paused research graph after human review."""
        run_id = workflow_id.replace("langgraph-", "").replace("agent-run-", "").replace("study-run-", "")

        def _run() -> None:
            try:
                import os
                worker_src = os.path.join(
                    os.path.dirname(__file__),
                    "..", "..", "..", "..", "worker", "src",
                )
                abs_path = os.path.abspath(worker_src)
                if abs_path not in sys.path:
                    sys.path.insert(0, abs_path)

                from worker.graph.runner import resume_research
                resume_research(run_id, approved_by, decision_comment)
            except Exception:
                logger.exception("langgraph_resume_failed run=%s", run_id)

        thread = Thread(target=_run, daemon=True, name=f"langgraph-resume-{run_id}")
        thread.start()


# Backward-compatible alias
StudyRuntimeWorkflowGateway = LangGraphStudyGateway


def create_gateway(*, database_url: str, **_kwargs: Any) -> LangGraphStudyGateway:
    """Factory function for creating the gateway."""
    return LangGraphStudyGateway(database_url=database_url)
