from contextlib import asynccontextmanager
import logging
import sys

import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.router import api_router
from app.core.auth import (
    AuthUnavailableError,
    InvalidCredentialsError,
    MissingCredentialsError,
    resolve_auth_context,
)
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


PUBLIC_PATHS = {
    "/",
    "/auth/login",
    "/auth/register",
    "/docs",
    "/openapi.json",
    "/health",
    "/healthz",
}
PUBLIC_PATH_SUFFIXES = (
    "/share",
    "/replay",
    "/report",
)


class AuthMiddleware(BaseHTTPMiddleware):
    """Protect non-public endpoints with either Bearer session or API key auth."""

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        settings = request.app.state.settings
        path = request.url.path

        if any(path.endswith(s) for s in PUBLIC_PATH_SUFFIXES):
            return await call_next(request)
        if path in PUBLIC_PATHS:
            return await call_next(request)
        if request.method == "OPTIONS":
            return await call_next(request)

        try:
            auth_context = resolve_auth_context(
                database_url=settings.database_url,
                authorization=request.headers.get("Authorization"),
                api_key=request.headers.get("X-API-Key"),
            )
        except MissingCredentialsError:
            return Response(
                content='{"detail":"Authentication required. Set Authorization: Bearer <token> or X-API-Key."}',
                status_code=401,
                media_type="application/json",
            )
        except InvalidCredentialsError:
            return Response(
                content='{"detail":"Invalid authentication credentials."}',
                status_code=403,
                media_type="application/json",
            )
        except AuthUnavailableError as exc:
            logger.warning("auth_unavailable path=%s error=%s", path, exc)
            return Response(
                content='{"detail":"Authentication service unavailable.","code":"auth_unavailable"}',
                status_code=503,
                media_type="application/json",
            )

        request.state.auth_context = auth_context
        request.state.current_user = auth_context.user
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
    app.add_middleware(AuthMiddleware)
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
