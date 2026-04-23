from __future__ import annotations

import unittest
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from app.core.errors import AppError
from app.study_runtime.service import (
    ApprovalDecision,
    CreateStudyCommand,
    FakeWorkflowGateway,
    ResumeRunCommand,
    StartRunCommand,
    StudyRuntimeService,
    SubmitPlanForApprovalCommand,
)


@dataclass
class InMemoryStudyRuntimeRepository:
    studies: dict[str, dict[str, Any]] = field(default_factory=dict)
    study_plans: dict[str, dict[str, Any]] = field(default_factory=dict)
    plan_versions: dict[str, dict[str, Any]] = field(default_factory=dict)
    approval_gates: dict[str, dict[str, Any]] = field(default_factory=dict)
    study_runs: dict[str, dict[str, Any]] = field(default_factory=dict)
    run_steps: dict[str, dict[str, Any]] = field(default_factory=dict)
    failed_runs: list[tuple[str, str, str | None]] = field(default_factory=list)
    _counter: int = 0

    def _next_id(self, prefix: str) -> str:
        self._counter += 1
        return f"{prefix}-{self._counter}"

    def create_study_bundle(self, command: CreateStudyCommand) -> dict[str, Any]:
        study_id = self._next_id("study")
        study_plan_id = self._next_id("plan")
        version_id = self._next_id("plan-version")
        study = {
            "id": study_id,
            "business_question": command.business_question,
            "study_type": command.study_type,
            "brand": command.brand,
            "category": command.category,
            "target_groups": list(command.target_groups),
            "status": "draft",
            "owner_team_id": command.owner_team_id,
            "team_id": command.team_id,
            "owner_user_id": command.owner_user_id,
        }
        plan = {
            "id": study_plan_id,
            "study_id": study_id,
            "current_draft_version_id": version_id,
            "latest_approved_version_id": None,
            "current_execution_version_id": None,
            "draft_status": "drafting",
            "last_generated_by": command.generated_by,
        }
        version = {
            "id": version_id,
            "study_id": study_id,
            "version_no": 1,
            "business_goal_json": command.business_goal,
            "twin_version_ids": list(command.twin_version_ids),
            "stimulus_ids": list(command.stimulus_ids),
            "anchor_set_id": command.anchor_set_id,
            "agent_config_ids": list(command.agent_config_ids),
            "qual_config_json": command.qual_config,
            "quant_config_json": command.quant_config,
            "estimated_cost": command.estimated_cost,
            "approval_required": command.approval_required,
            "approval_status": "draft",
            "approved_at": None,
            "generated_by": command.generated_by,
            "status": "draft",
        }
        self.studies[study_id] = study
        self.study_plans[study_id] = plan
        self.plan_versions[version_id] = version
        return {"study": study, "study_plan": plan, "study_plan_version": version}

    def get_study_bundle(self, study_id: str, team_id: str | None = None) -> dict[str, Any] | None:
        study = self.studies.get(study_id)
        if study is None:
            return None
        if team_id and (study.get("team_id") or study.get("owner_team_id")) != team_id:
            return None
        plan = self.study_plans[study_id]
        versions = [v for v in self.plan_versions.values() if v["study_id"] == study_id]
        approvals = [g for g in self.approval_gates.values() if g["scope_ref_id"] in {v["id"] for v in versions}]
        runs = [r for r in self.study_runs.values() if r["study_id"] == study_id]
        return {
            "study": study,
            "study_plan": plan,
            "plan_versions": sorted(versions, key=lambda item: item["version_no"]),
            "approval_gates": approvals,
            "study_runs": runs,
        }

    def get_plan_version(self, study_id: str, version_id: str) -> dict[str, Any] | None:
        version = self.plan_versions.get(version_id)
        if version and version["study_id"] == study_id:
            return version
        return None

    def submit_plan_for_approval(self, study_id: str, version_id: str, requested_by: str) -> dict[str, Any]:
        version = self.plan_versions[version_id]
        version["approval_status"] = "pending_approval"
        gate_id = self._next_id("approval")
        gate = {
            "id": gate_id,
            "scope_type": "study_plan_version",
            "scope_ref_id": version_id,
            "approval_type": "plan",
            "status": "requested",
            "requested_by": requested_by,
            "approved_by": None,
            "decision_comment": None,
        }
        self.approval_gates[gate_id] = gate
        self.studies[study_id]["status"] = "planning"
        self.study_plans[study_id]["draft_status"] = "awaiting_review"
        return dict(gate)

    def approve_plan(self, study_id: str, version_id: str, approved_by: str, decision_comment: str | None) -> dict[str, Any]:
        version = self.plan_versions[version_id]
        version["approval_status"] = "approved"
        version["status"] = "active"
        version["approved_at"] = "2026-04-03T00:00:00Z"
        plan = self.study_plans[study_id]
        plan["latest_approved_version_id"] = version_id
        plan["current_execution_version_id"] = version_id
        plan["draft_status"] = "approved"
        self.studies[study_id]["status"] = "planning"
        gate = next(
            gate
            for gate in self.approval_gates.values()
            if gate["scope_ref_id"] == version_id and gate["approval_type"] == "plan"
        )
        gate["status"] = "approved"
        gate["approved_by"] = approved_by
        gate["decision_comment"] = decision_comment
        return version

    def create_run(self, study_id: str, version_id: str, requested_by: str) -> dict[str, Any]:
        run_id = self._next_id("run")
        run = {
            "id": run_id,
            "study_id": study_id,
            "study_plan_version_id": version_id,
            "run_type": "initial",
            "status": "queued",
            "workflow_id": None,
            "workflow_run_id": None,
            "rerun_of_run_id": None,
            "reuse_source_run_id": None,
            "rerun_from_stage": None,
            "requested_by": requested_by,
        }
        self.study_runs[run_id] = run
        step_id = self._next_id("run-step")
        self.run_steps[step_id] = {
            "id": step_id,
            "study_run_id": run_id,
            "step_type": "twin_preparation",
            "status": "pending",
            "attempt_no": 1,
        }
        return run

    def bind_workflow(self, run_id: str, workflow_id: str, workflow_run_id: str | None) -> None:
        run = self.study_runs[run_id]
        run["workflow_id"] = workflow_id
        run["workflow_run_id"] = workflow_run_id

    def fail_run(self, study_id: str, run_id: str, reason: str | None = None) -> None:
        run = self.study_runs[run_id]
        run["status"] = "failed"
        run["failure_reason"] = reason
        self.failed_runs.append((study_id, run_id, reason))

    def get_run(self, study_id: str, run_id: str, team_id: str | None = None) -> dict[str, Any] | None:
        run = self.study_runs.get(run_id)
        if run and run["study_id"] == study_id:
            if team_id and (self.studies[study_id].get("team_id") or self.studies[study_id].get("owner_team_id")) != team_id:
                return None
            return dict(run)
        return None

    def list_studies(self, team_id: str | None = None) -> list[dict[str, Any]]:
        studies = list(self.studies.values())
        if team_id:
            studies = [
                study for study in studies
                if (study.get("team_id") or study.get("owner_team_id")) == team_id
            ]
        return [dict(study) for study in studies]


class RaisingWorkflowGateway(FakeWorkflowGateway):
    def start_study_run(self, run_id: str, study_id: str, plan_version_id: str) -> dict[str, str | None]:
        raise RuntimeError("workflow launch failed")


class CapturingWorkflowGateway(FakeWorkflowGateway):
    def __init__(self) -> None:
        super().__init__()
        self.resume_calls: list[tuple[str, str, str, str | None]] = []

    def resume_study_run(self, workflow_id: str, approved_by: str, action: str, decision_comment: str | None) -> None:
        self.resume_calls.append((workflow_id, approved_by, action, decision_comment))
        super().resume_study_run(workflow_id, approved_by, action, decision_comment)


class BindFailingRepository(InMemoryStudyRuntimeRepository):
    def bind_workflow(self, run_id: str, workflow_id: str, workflow_run_id: str | None) -> None:
        raise RuntimeError("workflow binding failed")


class StudyRuntimeServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = InMemoryStudyRuntimeRepository()
        self.workflow_gateway = FakeWorkflowGateway()
        self.service = StudyRuntimeService(
            repository=self.repository,
            workflow_gateway=self.workflow_gateway,
        )

    def test_create_study_creates_runtime_shaped_draft_bundle(self) -> None:
        command = CreateStudyCommand(
            business_question="Which concept wins?",
            study_type="concept_screening",
            brand="Danone",
            category="Maternal beverage",
            target_groups=["Pregnant Women", "New Mom"],
            business_goal={"objective": "find winner"},
            twin_version_ids=["twin-v1", "twin-v2"],
            stimulus_ids=["stim-1", "stim-2"],
            qual_config={"mode": "ai_idi"},
            quant_config={"mode": "ssr"},
            generated_by="boss",
            estimated_cost=Decimal("88.50"),
            owner_user_id="user-1",
            team_id="team-1",
            owner_team_id="team-1",
        )

        result = self.service.create_study(command)

        self.assertEqual(result["study"]["status"], "draft")
        self.assertEqual(result["study_plan"]["draft_status"], "drafting")
        self.assertEqual(result["study_plan_version"]["approval_status"], "draft")
        self.assertTrue(result["study_plan_version"]["approval_required"])

    def test_submit_and_approve_plan_promotes_execution_version(self) -> None:
        created = self.service.create_study(
            CreateStudyCommand(
                business_question="Which concept wins?",
                study_type="concept_screening",
                brand="Danone",
                category="Maternal beverage",
                target_groups=["Pregnant Women"],
                business_goal={"objective": "find winner"},
                twin_version_ids=["twin-v1"],
                stimulus_ids=["stim-1"],
                qual_config={"mode": "ai_idi"},
                quant_config={"mode": "ssr"},
                generated_by="boss",
                owner_user_id="user-1",
                team_id="team-1",
                owner_team_id="team-1",
            )
        )
        study_id = created["study"]["id"]
        version_id = created["study_plan_version"]["id"]

        gate = self.service.submit_plan_for_approval(
            SubmitPlanForApprovalCommand(
                study_id=study_id,
                study_plan_version_id=version_id,
                requested_by="boss",
            )
        )
        approved = self.service.approve_plan(
            ApprovalDecision(
                study_id=study_id,
                study_plan_version_id=version_id,
                approved_by="boss",
                decision_comment="Looks good",
            )
        )
        bundle = self.service.get_study_bundle(study_id)

        self.assertEqual(gate["status"], "requested")
        self.assertEqual(approved["approval_status"], "approved")
        self.assertEqual(bundle["study_plan"]["current_execution_version_id"], version_id)
        self.assertEqual(bundle["study_plan"]["latest_approved_version_id"], version_id)

    def test_start_run_requires_an_approved_plan_and_binds_workflow(self) -> None:
        created = self.service.create_study(
            CreateStudyCommand(
                business_question="Which concept wins?",
                study_type="concept_screening",
                brand="Danone",
                category="Maternal beverage",
                target_groups=["Pregnant Women"],
                business_goal={"objective": "find winner"},
                twin_version_ids=["twin-v1"],
                stimulus_ids=["stim-1"],
                qual_config={"mode": "ai_idi"},
                quant_config={"mode": "ssr"},
                generated_by="boss",
                owner_user_id="user-1",
                team_id="team-1",
                owner_team_id="team-1",
            )
        )
        study_id = created["study"]["id"]
        version_id = created["study_plan_version"]["id"]

        with self.assertRaises(AppError):
            self.service.start_run(
                StartRunCommand(
                    study_id=study_id,
                    study_plan_version_id=version_id,
                    requested_by="boss",
                )
            )

        self.service.submit_plan_for_approval(
            SubmitPlanForApprovalCommand(
                study_id=study_id,
                study_plan_version_id=version_id,
                requested_by="boss",
            )
        )
        self.service.approve_plan(
            ApprovalDecision(
                study_id=study_id,
                study_plan_version_id=version_id,
                approved_by="boss",
            )
        )

        run = self.service.start_run(
            StartRunCommand(
                study_id=study_id,
                study_plan_version_id=version_id,
                requested_by="boss",
            )
        )

        self.assertEqual(run["status"], "queued")
        self.assertTrue(run["workflow_id"].startswith("study-run-"))
        self.assertEqual(self.workflow_gateway.started_runs, [run["id"]])

    def test_start_run_marks_run_failed_if_workflow_launch_fails(self) -> None:
        repository = InMemoryStudyRuntimeRepository()
        service = StudyRuntimeService(
            repository=repository,
            workflow_gateway=RaisingWorkflowGateway(),
        )
        created = service.create_study(
            CreateStudyCommand(
                business_question="Which concept wins?",
                study_type="concept_screening",
                brand="Danone",
                category="Maternal beverage",
                target_groups=["Pregnant Women"],
                business_goal={"objective": "find winner"},
                twin_version_ids=["twin-v1"],
                stimulus_ids=["stim-1"],
                qual_config={"mode": "ai_idi"},
                quant_config={"mode": "ssr"},
                generated_by="boss",
                owner_user_id="user-1",
                team_id="team-1",
                owner_team_id="team-1",
            )
        )
        study_id = created["study"]["id"]
        version_id = created["study_plan_version"]["id"]
        service.submit_plan_for_approval(
            SubmitPlanForApprovalCommand(
                study_id=study_id,
                study_plan_version_id=version_id,
                requested_by="boss",
            )
        )
        service.approve_plan(
            ApprovalDecision(
                study_id=study_id,
                study_plan_version_id=version_id,
                approved_by="boss",
            )
        )

        with self.assertRaises(AppError):
            service.start_run(
                StartRunCommand(
                    study_id=study_id,
                    study_plan_version_id=version_id,
                    requested_by="boss",
                )
            )

        self.assertEqual(len(repository.failed_runs), 1)
        failed_study_id, failed_run_id, reason = repository.failed_runs[0]
        self.assertEqual(failed_study_id, study_id)
        self.assertEqual(repository.study_runs[failed_run_id]["status"], "failed")
        self.assertEqual(reason, "workflow launch failed")

    def test_start_run_marks_run_failed_if_binding_workflow_fails(self) -> None:
        repository = BindFailingRepository()
        service = StudyRuntimeService(
            repository=repository,
            workflow_gateway=FakeWorkflowGateway(),
        )
        created = service.create_study(
            CreateStudyCommand(
                business_question="Which concept wins?",
                study_type="concept_screening",
                brand="Danone",
                category="Maternal beverage",
                target_groups=["Pregnant Women"],
                business_goal={"objective": "find winner"},
                twin_version_ids=["twin-v1"],
                stimulus_ids=["stim-1"],
                qual_config={"mode": "ai_idi"},
                quant_config={"mode": "ssr"},
                generated_by="boss",
                owner_user_id="user-1",
                team_id="team-1",
                owner_team_id="team-1",
            )
        )
        study_id = created["study"]["id"]
        version_id = created["study_plan_version"]["id"]
        service.submit_plan_for_approval(
            SubmitPlanForApprovalCommand(
                study_id=study_id,
                study_plan_version_id=version_id,
                requested_by="boss",
            )
        )
        service.approve_plan(
            ApprovalDecision(
                study_id=study_id,
                study_plan_version_id=version_id,
                approved_by="boss",
            )
        )

        with self.assertRaises(AppError):
            service.start_run(
                StartRunCommand(
                    study_id=study_id,
                    study_plan_version_id=version_id,
                    requested_by="boss",
                )
            )

        self.assertEqual(len(repository.failed_runs), 1)
        failed_study_id, failed_run_id, reason = repository.failed_runs[0]
        self.assertEqual(failed_study_id, study_id)
        self.assertEqual(repository.study_runs[failed_run_id]["status"], "failed")
        self.assertEqual(reason, "workflow binding failed")

    def test_resume_run_forwards_canonical_action_to_workflow_gateway(self) -> None:
        workflow_gateway = CapturingWorkflowGateway()
        service = StudyRuntimeService(
            repository=InMemoryStudyRuntimeRepository(),
            workflow_gateway=workflow_gateway,
        )
        created = service.create_study(
            CreateStudyCommand(
                business_question="Which concept wins?",
                study_type="concept_screening",
                brand="Danone",
                category="Maternal beverage",
                target_groups=["Pregnant Women"],
                business_goal={"objective": "find winner"},
                twin_version_ids=["twin-v1"],
                stimulus_ids=["stim-1"],
                qual_config={"mode": "ai_idi"},
                quant_config={"mode": "ssr"},
                generated_by="boss",
                owner_user_id="user-1",
                team_id="team-1",
                owner_team_id="team-1",
            )
        )
        study_id = created["study"]["id"]
        version_id = created["study_plan_version"]["id"]
        service.submit_plan_for_approval(
            SubmitPlanForApprovalCommand(
                study_id=study_id,
                study_plan_version_id=version_id,
                requested_by="boss",
            )
        )
        service.approve_plan(
            ApprovalDecision(
                study_id=study_id,
                study_plan_version_id=version_id,
                approved_by="boss",
            )
        )
        run = service.start_run(
            StartRunCommand(
                study_id=study_id,
                study_plan_version_id=version_id,
                requested_by="boss",
            )
        )

        service.resume_run(
            ResumeRunCommand(
                study_id=study_id,
                study_run_id=run["id"],
                approved_by="boss",
                action="adjust_direction",
                decision_comment="请继续做更多访谈",
            )
        )

        self.assertEqual(
            workflow_gateway.resume_calls,
            [(run["workflow_id"], "boss", "adjust_direction", "请继续做更多访谈")],
        )


if __name__ == "__main__":
    unittest.main()
