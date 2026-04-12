"""Worker entry point.

With LangGraph, the graph runs in-process (via gateway background threads).
This worker process is kept for standalone execution and health checks.
"""

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
        "worker_starting (langgraph mode)",
        extra={
            "service": settings.service_name,
            "environment": settings.environment,
        },
    )

    # Verify graph can be built
    from worker.graph.builder import build_research_graph
    graph = build_research_graph()
    logger.info("research_graph_ready nodes=%d", len(graph.nodes))

    # Keep alive (graph execution happens via API gateway threads)
    try:
        while True:
            await asyncio.sleep(60)
    except asyncio.CancelledError:
        logger.info("worker_stopping")


def main() -> None:
    asyncio.run(run_worker())


if __name__ == "__main__":
    main()
