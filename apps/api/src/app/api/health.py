from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/healthz", tags=["health"])
async def healthz(request: Request) -> dict[str, str]:
    settings = request.app.state.settings
    return {
        "status": "ok",
        "service": settings.service_name,
        "environment": settings.environment,
        "version": settings.version,
    }

