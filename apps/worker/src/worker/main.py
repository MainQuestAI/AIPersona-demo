import asyncio
import logging

from worker.config import get_settings

logger = logging.getLogger(__name__)


def _configure_logging(log_level: str) -> None:
    level = getattr(logging, log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


async def run_worker() -> None:
    settings = get_settings()
    _configure_logging(settings.log_level)

    logger.info(
        "worker_starting",
        extra={
            "service": settings.service_name,
            "environment": settings.environment,
            "temporal_address": settings.temporal_address,
            "namespace": settings.temporal_namespace,
            "task_queue": settings.task_queue,
        },
    )

    from temporalio.client import Client
    from temporalio.worker import Worker
    from worker.activities import (
        advance_to_midrun_review,
        agent_midrun_to_complete,
        agent_plan_to_midrun,
        complete_study_run,
        mark_run_running,
    )
    from worker.workflows import AgentStudyWorkflow, LegacyStudyWorkflow, StudyWorkflow

    client = await Client.connect(
        settings.temporal_address,
        namespace=settings.temporal_namespace,
    )

    worker = Worker(
        client,
        task_queue=settings.task_queue,
        activities=[
            mark_run_running,
            advance_to_midrun_review,
            complete_study_run,
            agent_plan_to_midrun,
            agent_midrun_to_complete,
        ],
        workflows=[StudyWorkflow, LegacyStudyWorkflow, AgentStudyWorkflow],
    )
    await worker.run()


def main() -> None:
    asyncio.run(run_worker())


if __name__ == "__main__":
    main()
