from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    service_name: str
    version: str
    environment: str
    host: str
    port: int
    reload: bool
    log_level: str
    database_url: str
    cors_origins: list[str]
    dashscope_api_key: str
    dashscope_model: str
    api_key_required: bool


def _get_bool(name: str, default: str) -> bool:
    value = os.getenv(name, default).strip().lower()
    return value in {"1", "true", "yes", "on"}


def _get_list(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def _default_cors_origins() -> str:
    origins: list[str] = []
    for host in ("127.0.0.1", "localhost"):
        for port in range(5173, 5178):
            origins.append(f"http://{host}:{port}")
    return ",".join(origins)


def get_settings() -> Settings:
    return Settings(
        service_name=os.getenv("APP_NAME", "aipersona-api"),
        version=os.getenv("APP_VERSION", "0.1.0"),
        environment=os.getenv("APP_ENV", "development"),
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", "8000")),
        reload=_get_bool("API_RELOAD", "true"),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        database_url=os.getenv("DATABASE_URL", ""),
        cors_origins=_get_list(
            "API_CORS_ORIGINS",
            _default_cors_origins(),
        ),
        dashscope_api_key=os.getenv("DASHSCOPE_API_KEY", ""),
        dashscope_model=os.getenv("DASHSCOPE_MODEL", "qwen-plus"),
        api_key_required=_get_bool("API_KEY_REQUIRED", "false"),
    )
