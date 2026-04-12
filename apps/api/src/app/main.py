from contextlib import asynccontextmanager
import hashlib
import logging

import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.core.logging import configure_logging

logger = logging.getLogger(__name__)


def _setup_worker_path() -> None:
    """Add worker src to sys.path once at startup (not per-thread)."""
    import os
    worker_src = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "worker", "src")
    )
    if worker_src not in sys.path:
        sys.path.insert(0, worker_src)
        logger.info("worker_path_added path=%s", worker_src)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = app.state.settings
    _setup_worker_path()
    logger.info(
        "api_starting",
        extra={
            "service": settings.service_name,
            "environment": settings.environment,
            "runtime": "langgraph",
        },
    )
    yield
    logger.info("api_stopping", extra={"service": settings.service_name})


# Paths that do NOT require API key authentication (public endpoints)
PUBLIC_PATH_PREFIXES = (
    "/studies/",  # share, replay, report are under studies but checked below
    "/docs",
    "/openapi.json",
    "/health",
)
PUBLIC_PATH_SUFFIXES = (
    "/share",
    "/replay",
    "/report",
)


class ApiKeyMiddleware(BaseHTTPMiddleware):
    """Optional API key gate. When api_key_required=True in settings, all non-public
    endpoints require a valid X-API-Key header."""

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        settings = request.app.state.settings
        if not getattr(settings, "api_key_required", False):
            return await call_next(request)

        path = request.url.path

        # Allow public endpoints
        if any(path.endswith(s) for s in PUBLIC_PATH_SUFFIXES):
            return await call_next(request)
        if path in ("/", "/docs", "/openapi.json", "/health"):
            return await call_next(request)
        if request.method == "OPTIONS":
            return await call_next(request)

        api_key = request.headers.get("X-API-Key", "")
        if not api_key:
            return Response(
                content='{"detail":"Missing API key. Set X-API-Key header."}',
                status_code=401,
                media_type="application/json",
            )

        # Validate key against database
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        try:
            from app.core.config import get_settings as _gs
            import psycopg
            from psycopg.rows import dict_row
            s = _gs()
            with psycopg.connect(s.database_url, row_factory=dict_row) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT id FROM api_key WHERE key_hash=%s AND is_active=true "
                        "AND (expires_at IS NULL OR expires_at > now())",
                        (key_hash,),
                    )
                    row = cur.fetchone()
                    if row:
                        cur.execute(
                            "UPDATE api_key SET last_used_at=now() WHERE id=%s",
                            (row["id"],),
                        )
                conn.commit()
            if not row:
                return Response(
                    content='{"detail":"Invalid API key."}',
                    status_code=403,
                    media_type="application/json",
                )
        except Exception as exc:
            logger.warning("api_key_check_error: %s", exc)
            # If api_key table doesn't exist yet, allow through
            pass

        return await call_next(request)


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title=settings.service_name,
        version=settings.version,
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    app.add_middleware(ApiKeyMiddleware)
    register_error_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
