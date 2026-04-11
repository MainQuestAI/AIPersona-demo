from __future__ import annotations

import asyncio
from queue import Queue
from threading import Thread

from temporalio.client import Client


class TemporalStudyRuntimeWorkflowGateway:
    def __init__(self, *, temporal_target: str, namespace: str, task_queue: str) -> None:
        self._temporal_target = temporal_target
        self._namespace = namespace
        self._task_queue = task_queue

    @staticmethod
    def _run_coroutine(coro):
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(coro)

        queue: Queue[tuple[bool, object]] = Queue(maxsize=1)

        def runner() -> None:
            try:
                queue.put((True, asyncio.run(coro)))
            except Exception as error:  # pragma: no cover - defensive handoff
                queue.put((False, error))

        thread = Thread(target=runner, daemon=True)
        thread.start()
        thread.join()

        ok, payload = queue.get()
        if ok:
            return payload
        raise payload

    def start_study_run(self, run_id: str, study_id: str, plan_version_id: str) -> dict[str, str | None]:
        workflow_id = f"study-run-{run_id}"

        async def runner() -> dict[str, str | None]:
            client = await Client.connect(self._temporal_target, namespace=self._namespace)
            handle = await client.start_workflow(
                "StudyWorkflow",
                {
                    "study_id": study_id,
                    "study_run_id": run_id,
                    "study_plan_version_id": plan_version_id,
                },
                id=workflow_id,
                task_queue=self._task_queue,
            )
            return {"workflow_id": workflow_id, "workflow_run_id": handle.result_run_id}

        return self._run_coroutine(runner())

    def start_agent_study_run(self, run_id: str, study_id: str, plan_version_id: str) -> dict[str, str | None]:
        workflow_id = f"agent-run-{run_id}"

        async def runner() -> dict[str, str | None]:
            client = await Client.connect(self._temporal_target, namespace=self._namespace)
            handle = await client.start_workflow(
                "AgentStudyWorkflow",
                {
                    "study_id": study_id,
                    "study_run_id": run_id,
                    "study_plan_version_id": plan_version_id,
                },
                id=workflow_id,
                task_queue=self._task_queue,
            )
            return {"workflow_id": workflow_id, "workflow_run_id": handle.result_run_id}

        return self._run_coroutine(runner())

    def resume_study_run(self, workflow_id: str, approved_by: str, decision_comment: str | None) -> None:
        async def runner() -> None:
            client = await Client.connect(self._temporal_target, namespace=self._namespace)
            handle = client.get_workflow_handle(workflow_id)
            await handle.signal(
                "resume_after_midrun_review",
                {
                    "approved_by": approved_by,
                    "decision_comment": decision_comment,
                },
            )

        self._run_coroutine(runner())
