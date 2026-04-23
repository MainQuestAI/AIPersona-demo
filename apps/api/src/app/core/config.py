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
    web_app_origins: list[str]
    dashscope_api_key: str
    dashscope_model: str
    api_key_required: bool
    enable_dev_auth: bool
    oauth_server_url: str
    oauth_client_id: str
    oauth_client_secret: str
    session_cookie_secret: str
    shared_demo_team_slug: str
    shared_demo_team_name: str


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
        origins.append(f"http://{host}:4173")
    return ",".join(origins)


def _default_web_app_origins() -> str:
    return _default_cors_origins()


def validate_settings(settings: Settings) -> None:
    if not settings.database_url.strip():
        raise ValueError("DATABASE_URL is required")

    if settings.enable_dev_auth:
        return

    missing = [
        name
        for name, value in (
            ("OAUTH_SERVER_URL", settings.oauth_server_url),
            ("OAUTH_CLIENT_ID", settings.oauth_client_id),
            ("OAUTH_CLIENT_SECRET", settings.oauth_client_secret),
            ("SESSION_COOKIE_SECRET", settings.session_cookie_secret),
            ("WEB_APP_ORIGINS", ",".join(settings.web_app_origins)),
        )
        if not value.strip()
    ]
    if missing:
        raise ValueError(f"Missing required auth settings: {', '.join(missing)}")


def get_settings() -> Settings:
    settings = Settings(
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
        web_app_origins=_get_list(
            "WEB_APP_ORIGINS",
            _default_web_app_origins(),
        ),
        dashscope_api_key=os.getenv("DASHSCOPE_API_KEY", ""),
        dashscope_model=os.getenv("DASHSCOPE_MODEL", "qwen-plus"),
        api_key_required=_get_bool("API_KEY_REQUIRED", "false"),
        enable_dev_auth=_get_bool("ENABLE_DEV_AUTH", "false"),
        oauth_server_url=os.getenv("OAUTH_SERVER_URL", "").rstrip("/"),
        oauth_client_id=os.getenv("OAUTH_CLIENT_ID", ""),
        oauth_client_secret=os.getenv("OAUTH_CLIENT_SECRET", ""),
        session_cookie_secret=os.getenv("SESSION_COOKIE_SECRET", ""),
        shared_demo_team_slug=os.getenv("SHARED_DEMO_TEAM_SLUG", "shared-demo"),
        shared_demo_team_name=os.getenv("SHARED_DEMO_TEAM_NAME", "共享演示团队"),
    )
    validate_settings(settings)
    return settings
