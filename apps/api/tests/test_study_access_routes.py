from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.auth import AuthContext, SessionUser, TeamMembership
from app.core.errors import AppError
from app.main import create_app
from app.study_runtime.routes import get_study_runtime_service


class RecordingStudyRuntimeService:
    def __init__(self) -> None:
        self.list_team_ids: list[str | None] = []
        self.bundle_calls: list[tuple[str, str | None]] = []
        self.submit_requested_by: list[str] = []
        self.start_requested_by: list[str] = []

    def list_studies(self, *, team_id: str | None = None) -> list[dict[str, str]]:
        self.list_team_ids.append(team_id)
        return [{"id": "study-1", "status": "draft"}]

    def get_study_bundle(self, study_id: str, *, team_id: str | None = None) -> dict[str, object]:
        self.bundle_calls.append((study_id, team_id))
        if team_id != "team-1" or study_id != "study-1":
            raise AppError("Study not found", code="study_not_found", status_code=404)
        return {
            "study": {"id": study_id, "status": "draft"},
            "study_plan": {"id": "plan-1", "current_execution_version_id": None},
            "plan_versions": [],
            "approval_gates": [],
            "study_runs": [],
        }

    def submit_plan_for_approval(self, command) -> dict[str, str]:
        self.submit_requested_by.append(command.requested_by)
        return {"status": "requested"}

    def start_run(self, command) -> dict[str, str]:
        self.start_requested_by.append(command.requested_by)
        return {"id": "run-1", "status": "queued"}


def authenticated_context() -> AuthContext:
    return AuthContext(
        user=SessionUser(
            id="user-1",
            email="owner@example.com",
            display_name="Stage Owner",
            role="owner",
        )
    )


class StudyAccessRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app()
        self.service = RecordingStudyRuntimeService()
        self.app.dependency_overrides[get_study_runtime_service] = lambda: self.service
        self.client = TestClient(self.app)

    def tearDown(self) -> None:
        self.app.dependency_overrides.clear()

    def test_single_team_request_auto_scopes_study_list(self) -> None:
        with patch("app.main.resolve_auth_context", return_value=authenticated_context()):
            with patch(
                "app.study_runtime.routes.list_user_teams",
                return_value=[TeamMembership(id="team-1", name="Alpha", slug="alpha", member_role="owner")],
            ):
                response = self.client.get("/studies", headers={"Authorization": "Bearer test-token"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.service.list_team_ids, ["team-1"])

    def test_multi_team_user_defaults_to_first_team_when_no_shared_demo_team_is_present(self) -> None:
        with patch("app.main.resolve_auth_context", return_value=authenticated_context()):
            with patch(
                "app.study_runtime.routes.list_user_teams",
                return_value=[
                    TeamMembership(id="team-1", name="Alpha", slug="alpha", member_role="owner"),
                    TeamMembership(id="team-2", name="Beta", slug="beta", member_role="member"),
                ],
            ):
                response = self.client.get("/studies", headers={"Authorization": "Bearer test-token"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.service.list_team_ids, ["team-1"])

    def test_rejects_team_header_outside_membership(self) -> None:
        with patch("app.main.resolve_auth_context", return_value=authenticated_context()):
            with patch(
                "app.study_runtime.routes.list_user_teams",
                return_value=[TeamMembership(id="team-1", name="Alpha", slug="alpha", member_role="owner")],
            ):
                response = self.client.get(
                    "/studies",
                    headers={"Authorization": "Bearer test-token", "X-Team-Id": "team-999"},
                )

        self.assertEqual(response.status_code, 403)

    def test_submit_plan_ignores_spoofed_actor_and_binds_session_user(self) -> None:
        with patch("app.main.resolve_auth_context", return_value=authenticated_context()):
            with patch(
                "app.study_runtime.routes.list_user_teams",
                return_value=[TeamMembership(id="team-1", name="Alpha", slug="alpha", member_role="owner")],
            ):
                response = self.client.post(
                    "/studies/study-1/plan-versions/version-1/submit",
                    headers={"Authorization": "Bearer test-token", "X-Team-Id": "team-1"},
                    json={"actor": "spoofed-user"},
                )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.service.submit_requested_by, ["Stage Owner"])
        self.assertEqual(self.service.bundle_calls[0], ("study-1", "team-1"))

    def test_start_run_ignores_spoofed_requested_by_and_uses_team_scope(self) -> None:
        with patch("app.main.resolve_auth_context", return_value=authenticated_context()):
            with patch(
                "app.study_runtime.routes.list_user_teams",
                return_value=[TeamMembership(id="team-1", name="Alpha", slug="alpha", member_role="owner")],
            ):
                response = self.client.post(
                    "/studies/study-1/runs",
                    headers={"Authorization": "Bearer test-token", "X-Team-Id": "team-1"},
                    json={"study_plan_version_id": "version-1", "requested_by": "spoofed-user"},
                )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.service.start_requested_by, ["Stage Owner"])
        self.assertEqual(self.service.bundle_calls[0], ("study-1", "team-1"))

    def test_study_detail_returns_404_when_study_is_out_of_scope(self) -> None:
        with patch("app.main.resolve_auth_context", return_value=authenticated_context()):
            with patch(
                "app.study_runtime.routes.list_user_teams",
                return_value=[TeamMembership(id="team-1", name="Alpha", slug="alpha", member_role="owner")],
            ):
                response = self.client.get(
                    "/studies/study-404",
                    headers={"Authorization": "Bearer test-token", "X-Team-Id": "team-1"},
                )

        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
