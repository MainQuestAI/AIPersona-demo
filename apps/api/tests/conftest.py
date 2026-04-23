from __future__ import annotations

import sys
from pathlib import Path
import os


ROOT = Path(__file__).resolve().parents[3]
WORKER_SRC = ROOT / "apps" / "worker" / "src"

if str(WORKER_SRC) not in sys.path:
    sys.path.insert(0, str(WORKER_SRC))

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@127.0.0.1:5432/aipersona_test")
os.environ.setdefault("ENABLE_DEV_AUTH", "true")
os.environ.setdefault("WEB_APP_ORIGINS", "http://127.0.0.1:5174,http://localhost:5174")
