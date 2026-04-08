from dataclasses import dataclass
import os


@dataclass(frozen=True)
class WorkerSettings:
    service_name: str
    version: str
    environment: str
    log_level: str
    database_url: str
    temporal_address: str
    temporal_namespace: str
    task_queue: str
    dashscope_api_key: str
    dashscope_model: str


def get_settings() -> WorkerSettings:
    return WorkerSettings(
        service_name=os.getenv("WORKER_APP_NAME", os.getenv("APP_NAME", "aipersona-worker")),
        version=os.getenv("APP_VERSION", "0.1.0"),
        environment=os.getenv("APP_ENV", "development"),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        database_url=os.getenv("DATABASE_URL", ""),
        temporal_address=os.getenv("TEMPORAL_ADDRESS", "localhost:7233"),
        temporal_namespace=os.getenv("TEMPORAL_NAMESPACE", "default"),
        task_queue=os.getenv("TEMPORAL_TASK_QUEUE", "study-task-queue"),
        dashscope_api_key=os.getenv("DASHSCOPE_API_KEY", ""),
        dashscope_model=os.getenv("DASHSCOPE_MODEL", "qwen-plus"),
    )
