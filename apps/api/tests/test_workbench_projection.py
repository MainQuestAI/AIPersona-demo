from __future__ import annotations

import asyncio
import unittest

from app.study_runtime.routes import get_workbench_projection
from app.study_runtime.service import FakeWorkflowGateway, StudyRuntimeService


class FakeBundleService(StudyRuntimeService):
    def __init__(self, bundle: dict):
        self._bundle = bundle

    def get_study_bundle(self, study_id: str) -> dict:
        if study_id != self._bundle["study"]["id"]:
            raise AssertionError("unexpected study id")
        return self._bundle


class WorkbenchProjectionTests(unittest.TestCase):
    def test_workbench_projection_shapes_latest_plan_and_run_for_frontend_consumption(self) -> None:
        bundle = {
            "study": {
                "id": "study-1",
                "business_question": "Which concept wins?",
                "study_type": "concept_screening",
                "brand": "Danone",
                "category": "Maternal beverage",
                "target_groups": ["Pregnant Women", "New Mom"],
                "status": "completed",
            },
            "study_plan": {
                "id": "plan-1",
                "study_id": "study-1",
                "current_draft_version_id": "version-2",
                "latest_approved_version_id": "version-2",
                "current_execution_version_id": "version-2",
                "draft_status": "approved",
            },
            "plan_versions": [
                {
                    "id": "version-1",
                    "version_no": 1,
                    "approval_status": "approved",
                    "status": "archived",
                    "approval_required": True,
                    "generated_by": "boss",
                    "estimated_cost": "45.00",
                    "twin_version_ids": ["t1"],
                    "stimulus_ids": ["s1", "s2"],
                    "qual_config_json": {"mode": "ai_idi"},
                    "quant_config_json": {"mode": "ssr"},
                    "created_at": "2026-04-03T09:00:00+08:00",
                },
                {
                    "id": "version-2",
                    "version_no": 2,
                    "approval_status": "approved",
                    "status": "active",
                    "approval_required": True,
                    "generated_by": "boss",
                    "estimated_cost": "88.50",
                    "twin_version_ids": ["t1", "t2"],
                    "stimulus_ids": ["s1", "s2", "s3"],
                    "qual_config_json": {"mode": "ai_idi"},
                    "quant_config_json": {"mode": "ssr"},
                    "created_at": "2026-04-03T10:00:00+08:00",
                },
            ],
            "approval_gates": [
                {
                    "id": "approval-plan",
                    "scope_type": "study_plan_version",
                    "scope_ref_id": "version-2",
                    "approval_type": "plan",
                    "status": "approved",
                    "approved_by": "boss",
                    "decision_comment": "go",
                    "updated_at": "2026-04-03T10:10:00+08:00",
                },
                {
                    "id": "approval-midrun",
                    "scope_type": "study_run",
                    "scope_ref_id": "run-2",
                    "approval_type": "midrun",
                    "status": "approved",
                    "approved_by": "boss",
                    "decision_comment": "continue",
                    "updated_at": "2026-04-03T10:20:00+08:00",
                },
            ],
            "study_runs": [
                {
                    "id": "run-1",
                    "study_id": "study-1",
                    "study_plan_version_id": "version-1",
                    "status": "failed",
                    "workflow_id": "study-run-run-1",
                    "created_at": "2026-04-03T09:30:00+08:00",
                    "updated_at": "2026-04-03T09:40:00+08:00",
                    "run_steps": [],
                    "approval_gates": [],
                },
                {
                    "id": "run-2",
                    "study_id": "study-1",
                    "study_plan_version_id": "version-2",
                    "status": "succeeded",
                    "workflow_id": "study-run-run-2",
                    "created_at": "2026-04-03T10:15:00+08:00",
                    "updated_at": "2026-04-03T10:30:00+08:00",
                    "run_steps": [
                        {"step_type": "twin_preparation", "status": "succeeded"},
                        {"step_type": "qual_execution", "status": "succeeded"},
                        {"step_type": "quant_execution", "status": "succeeded"},
                    ],
                    "approval_gates": [
                        {
                            "approval_type": "midrun",
                            "status": "approved",
                            "approved_by": "boss",
                        }
                    ],
                },
            ],
        }

        result = asyncio.run(
            get_workbench_projection(
                study_id="study-1",
                service=FakeBundleService(bundle),
            )
        )

        self.assertEqual(result["study"]["id"], "study-1")
        self.assertEqual(result["latest_plan_version"]["id"], "version-2")
        self.assertEqual(result["latest_plan_version"]["stimulus_count"], 3)
        self.assertEqual(result["latest_plan_version"]["twin_count"], 2)
        self.assertEqual(result["latest_plan_version"]["stimulus_ids"], ["s1", "s2", "s3"])
        self.assertEqual(result["latest_plan_version"]["twin_version_ids"], ["t1", "t2"])
        self.assertEqual(result["current_run"]["id"], "run-2")
        self.assertEqual(result["current_run"]["step_count"], 3)
        self.assertEqual(result["current_run"]["approval_status"], "approved")
        self.assertEqual(
            result["current_run"]["steps"],
            [
                {
                    "step_type": "twin_preparation",
                    "status": "succeeded",
                    "started_at": None,
                    "ended_at": None,
                },
                {
                    "step_type": "qual_execution",
                    "status": "succeeded",
                    "started_at": None,
                    "ended_at": None,
                },
                {
                    "step_type": "quant_execution",
                    "status": "succeeded",
                    "started_at": None,
                    "ended_at": None,
                },
            ],
        )
        self.assertEqual(result["summary"]["total_plan_versions"], 2)
        self.assertEqual(result["summary"]["total_runs"], 2)


if __name__ == "__main__":
    unittest.main()
