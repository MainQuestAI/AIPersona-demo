from __future__ import annotations

from dataclasses import replace
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.auth import AuthContext, SessionUser, TeamMembership
from app.main import create_app


def authenticated_context() -> AuthContext:
    return AuthContext(
        user=SessionUser(
            id="local-user-1",
            email="owner@example.com",
            display_name="Stage Owner",
            role="member",
            auth_user_id="auth-user-1",
            auth_provider="mainquest-auth",
        ),
        session_token="session-token-1",
        session_type="oauth",
    )


class AuthRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app()
        self.client = TestClient(self.app)

    def test_legacy_login_endpoint_returns_gone(self) -> None:
        response = self.client.post("/auth/login")

        self.assertEqual(response.status_code, 410)
        self.assertIn("MainQuest Auth", response.json()["detail"])

    def test_auth_me_returns_user_and_active_shared_demo_team(self) -> None:
        with patch("app.main.resolve_auth_context", return_value=authenticated_context()):
            with patch(
                "app.api.auth_routes.list_user_teams",
                return_value=[
                    TeamMembership(id="team-1", name="共享演示团队", slug="shared-demo", member_role="member"),
                    TeamMembership(id="team-2", name="Alpha", slug="alpha", member_role="owner"),
                ],
            ):
                response = self.client.get("/auth/me", headers={"Authorization": "Bearer test-token"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["user"]["auth_user_id"], "auth-user-1")
        self.assertEqual(payload["team"]["slug"], "shared-demo")
        self.assertEqual(payload["active_team_id"], "team-1")
        self.assertEqual(payload["auth_mode"], "oauth")

    def test_dev_login_is_disabled_without_enable_dev_auth(self) -> None:
        self.app.state.settings = replace(self.app.state.settings, enable_dev_auth=False)
        response = self.client.get("/api/dev/login")

        self.assertEqual(response.status_code, 404)

    def test_dev_login_accepts_local_origin_in_docker_like_requests(self) -> None:
        self.app.state.settings = replace(
            self.app.state.settings,
            enable_dev_auth=True,
            web_app_origins=["http://localhost:5174"],
        )
        with patch(
            "app.api.auth_routes.ensure_dev_auth_session",
            return_value=(
                SessionUser(
                    id="local-user-1",
                    email="demo@mirrorworld.local",
                    display_name="MirrorWorld Demo",
                    role="member",
                    auth_user_id="dev-local-user",
                    auth_provider="dev",
                ),
                TeamMembership(id="team-1", name="共享演示团队", slug="shared-demo", member_role="owner"),
                "session-token-1",
                "2099-01-01T00:00:00Z",
            ),
        ):
            response = self.client.get(
                "/api/dev/login?redirect_to=/dashboard",
                headers={
                    "origin": "http://localhost:5174",
                    "host": "localhost:8000",
                },
                follow_redirects=False,
            )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.headers["location"], "http://localhost:5174/dashboard")
        self.assertIn("app_session_id=", response.headers.get("set-cookie", ""))


if __name__ == "__main__":
    unittest.main()
