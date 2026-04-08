from fastapi import APIRouter

from app.api.health import router as health_router
from app.study_runtime.routes import router as study_runtime_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(study_runtime_router)
