from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import create_app
from app.core.auth import AuthUnavailableError, MissingCredentialsError
from app.study_runtime.routes import ChatRequest


class ApiAppConfigurationTests(unittest.TestCase):
    def test_create_app_registers_cors_middleware_for_local_web_workbench(self) -> None:
        original_env = dict(os.environ)
        try:
            os.environ["API_CORS_ORIGINS"] = "http://127.0.0.1:5173,http://localhost:5173"

            app = create_app()

            cors_middleware = next(
                (middleware for middleware in app.user_middleware if middleware.cls.__name__ == "CORSMiddleware"),
                None,
            )

            self.assertIsNotNone(cors_middleware)
            self.assertEqual(
                cors_middleware.kwargs["allow_origins"],
                ["http://127.0.0.1:5173", "http://localhost:5173"],
            )
            self.assertIn("GET", cors_middleware.kwargs["allow_methods"])
            self.assertIn("POST", cors_middleware.kwargs["allow_methods"])
        finally:
            os.environ.clear()
            os.environ.update(original_env)

    def test_chat_request_rejects_overlong_messages(self) -> None:
        with self.assertRaises(ValidationError):
            ChatRequest(message="x" * 4001)

    def test_protected_routes_require_credentials(self) -> None:
        app = create_app()
        with patch("app.main.resolve_auth_context", side_effect=MissingCredentialsError("missing")):
            client = TestClient(app)
            response = client.get("/studies")

        self.assertEqual(response.status_code, 401)
        self.assertIn("Authentication required", response.text)

    def test_protected_routes_fail_closed_when_auth_backend_is_unavailable(self) -> None:
        app = create_app()
        with patch("app.main.resolve_auth_context", side_effect=AuthUnavailableError("db down")):
            client = TestClient(app)
            response = client.get("/studies", headers={"Authorization": "Bearer test-token"})

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["code"], "auth_unavailable")

    def test_healthz_remains_public(self) -> None:
        app = create_app()
        with patch("app.main.resolve_auth_context", side_effect=AssertionError("healthz should bypass auth")):
            client = TestClient(app)
            response = client.get("/healthz")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")


if __name__ == "__main__":
    unittest.main()
