try:
    import asyncio
    from typing import Optional

    from temporalio import workflow
except ImportError:  # pragma: no cover - local skeleton fallback
    workflow = None


if workflow is not None:
    with workflow.unsafe.imports_passed_through():
        from datetime import timedelta

        from worker.activities import (
            advance_to_midrun_review,
            complete_study_run,
            mark_run_running,
        )

    class _StudyWorkflowBase:
        def __init__(self) -> None:
            self._resume_requested = False
            self._resume_payload: Optional[dict[str, Optional[str]]] = None

        async def _run_impl(self, payload: dict[str, str]) -> str:
            workflow.logger.info("study_workflow_started %s", payload)
            timeout = timedelta(seconds=600)
            await workflow.execute_activity(mark_run_running, payload, start_to_close_timeout=timeout)
            await workflow.execute_activity(advance_to_midrun_review, payload, start_to_close_timeout=timeout)
            try:
                await workflow.wait_condition(
                    lambda: self._resume_requested,
                    timeout=timedelta(days=7),
                    timeout_summary="midrun-review-approval",
                )
            except asyncio.TimeoutError as exc:
                raise RuntimeError("Mid-run review approval timed out after 7 days") from exc
            assert self._resume_payload is not None
            completion_payload = {
                **payload,
                "approved_by": self._resume_payload["approved_by"],
                "decision_comment": self._resume_payload.get("decision_comment"),
            }
            await workflow.execute_activity(
                complete_study_run,
                completion_payload,
                start_to_close_timeout=timeout,
            )
            workflow.logger.info("study_workflow_completed %s", completion_payload)
            return "study-workflow-completed"

        async def _resume_impl(self, payload: dict[str, Optional[str]]) -> None:
            self._resume_payload = payload
            self._resume_requested = True

    @workflow.defn(name="StudyWorkflow")
    class StudyWorkflow(_StudyWorkflowBase):
        """Primary study runtime workflow."""

        @workflow.run
        async def run(self, payload: dict[str, str]) -> str:
            return await self._run_impl(payload)

        @workflow.signal
        async def resume_after_midrun_review(self, payload: dict[str, Optional[str]]) -> None:
            await self._resume_impl(payload)

    @workflow.defn(name="StudyWorkflow.run")
    class LegacyStudyWorkflow(_StudyWorkflowBase):
        """Compatibility registration for historical workflow type names."""

        @workflow.run
        async def run(self, payload: dict[str, str]) -> str:
            return await self._run_impl(payload)

        @workflow.signal
        async def resume_after_midrun_review(self, payload: dict[str, Optional[str]]) -> None:
            await self._resume_impl(payload)
else:

    class StudyWorkflow:
        """Fallback skeleton used when Temporal SDK is not installed locally."""

        async def run(self, payload: dict[str, str]) -> str:
            del payload
            return "study-workflow-skeleton"

        async def resume_after_midrun_review(self, payload: dict[str, Optional[str]]) -> None:
            del payload

    class LegacyStudyWorkflow(StudyWorkflow):
        pass
