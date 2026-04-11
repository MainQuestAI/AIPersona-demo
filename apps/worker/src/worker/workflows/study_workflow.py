try:
    import asyncio
    from typing import Optional

    from temporalio import workflow
except ImportError:  # pragma: no cover - local skeleton fallback
    workflow = None


if workflow is not None:
    with workflow.unsafe.imports_passed_through():
        from datetime import timedelta

        from temporalio.common import RetryPolicy

        from worker.activities import (
            advance_to_midrun_review,
            agent_midrun_to_complete,
            agent_plan_to_midrun,
            complete_study_run,
            mark_run_running,
        )

    class _StudyWorkflowBase:
        def __init__(self) -> None:
            self._resume_requested = False
            self._resume_payload: Optional[dict[str, Optional[str]]] = None

        async def _run_impl(self, payload: dict[str, str]) -> str:
            workflow.logger.info("study_workflow_started %s", payload)
            timeout = timedelta(seconds=900)
            retry = RetryPolicy(maximum_attempts=3, backoff_coefficient=2.0)
            await workflow.execute_activity(mark_run_running, payload, start_to_close_timeout=timeout, retry_policy=retry)
            await workflow.execute_activity(advance_to_midrun_review, payload, start_to_close_timeout=timeout, retry_policy=retry)
            try:
                await workflow.wait_condition(
                    lambda: self._resume_requested,
                    timeout=timedelta(days=7),
                    timeout_summary="midrun-review-approval",
                )
            except asyncio.TimeoutError as exc:
                raise RuntimeError("Mid-run review approval timed out after 7 days") from exc
            if self._resume_payload is None:
                raise RuntimeError("Resume payload is missing")
            completion_payload = {
                **payload,
                "approved_by": self._resume_payload["approved_by"],
                "decision_comment": self._resume_payload.get("decision_comment"),
            }
            await workflow.execute_activity(
                complete_study_run,
                completion_payload,
                start_to_close_timeout=timeout,
                retry_policy=retry,
            )
            workflow.logger.info("study_workflow_completed %s", completion_payload)
            return "study-workflow-completed"

        async def _resume_impl(self, payload: dict[str, Optional[str]]) -> None:
            self._resume_payload = payload
            self._resume_requested = True

    class _AgentWorkflowBase:
        """Agent-driven workflow: uses incremental message posting."""

        def __init__(self) -> None:
            self._resume_requested = False
            self._resume_payload: Optional[dict[str, Optional[str]]] = None

        async def _run_impl(self, payload: dict[str, str]) -> str:
            workflow.logger.info("agent_workflow_started %s", payload)
            timeout = timedelta(seconds=900)
            retry = RetryPolicy(maximum_attempts=3, backoff_coefficient=2.0)

            # Phase 1: plan → qual → midrun review
            await workflow.execute_activity(
                agent_plan_to_midrun, payload,
                start_to_close_timeout=timeout, retry_policy=retry,
            )

            # Wait for user to approve midrun
            try:
                await workflow.wait_condition(
                    lambda: self._resume_requested,
                    timeout=timedelta(days=7),
                    timeout_summary="agent-midrun-approval",
                )
            except asyncio.TimeoutError as exc:
                raise RuntimeError("Agent midrun approval timed out") from exc

            if self._resume_payload is None:
                raise RuntimeError("Resume payload is missing")

            # Phase 2: scoring → recommendation → complete
            completion_payload = {
                **payload,
                "approved_by": self._resume_payload.get("approved_by"),
                "decision_comment": self._resume_payload.get("decision_comment"),
            }
            await workflow.execute_activity(
                agent_midrun_to_complete, completion_payload,
                start_to_close_timeout=timeout, retry_policy=retry,
            )

            workflow.logger.info("agent_workflow_completed %s", completion_payload)
            return "agent-workflow-completed"

        async def _resume_impl(self, payload: dict[str, Optional[str]]) -> None:
            self._resume_payload = payload
            self._resume_requested = True

    # --- Legacy workflow (keep for backward compat) ---

    @workflow.defn(name="StudyWorkflow")
    class StudyWorkflow(_StudyWorkflowBase):
        @workflow.run
        async def run(self, payload: dict[str, str]) -> str:
            return await self._run_impl(payload)

        @workflow.signal
        async def resume_after_midrun_review(self, payload: dict[str, Optional[str]]) -> None:
            await self._resume_impl(payload)

    @workflow.defn(name="StudyWorkflow.run")
    class LegacyStudyWorkflow(_StudyWorkflowBase):
        @workflow.run
        async def run(self, payload: dict[str, str]) -> str:
            return await self._run_impl(payload)

        @workflow.signal
        async def resume_after_midrun_review(self, payload: dict[str, Optional[str]]) -> None:
            await self._resume_impl(payload)

    # --- Agent-driven workflow ---

    @workflow.defn(name="AgentStudyWorkflow")
    class AgentStudyWorkflow(_AgentWorkflowBase):
        @workflow.run
        async def run(self, payload: dict[str, str]) -> str:
            return await self._run_impl(payload)

        @workflow.signal
        async def resume_after_midrun_review(self, payload: dict[str, Optional[str]]) -> None:
            await self._resume_impl(payload)

else:

    class StudyWorkflow:
        async def run(self, payload: dict[str, str]) -> str:
            del payload
            return "study-workflow-skeleton"

        async def resume_after_midrun_review(self, payload: dict[str, Optional[str]]) -> None:
            del payload

    class LegacyStudyWorkflow(StudyWorkflow):
        pass

    class AgentStudyWorkflow(StudyWorkflow):
        pass
