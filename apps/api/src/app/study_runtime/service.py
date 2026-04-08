from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Protocol

from app.core.errors import AppError
from app.study_runtime.projections import build_study_detail_projection


@dataclass(frozen=True)
class CreateStudyCommand:
    business_question: str
    study_type: str
    brand: str
    category: str
    target_groups: list[str]
    business_goal: dict[str, Any]
    twin_version_ids: list[str]
    stimulus_ids: list[str]
    qual_config: dict[str, Any]
    quant_config: dict[str, Any]
    generated_by: str
    owner_team_id: str | None = None
    anchor_set_id: str | None = None
    agent_config_ids: list[str] = field(default_factory=list)
    estimated_cost: Decimal | None = None
    approval_required: bool = True


@dataclass(frozen=True)
class SubmitPlanForApprovalCommand:
    study_id: str
    study_plan_version_id: str
    requested_by: str


@dataclass(frozen=True)
class ApprovalDecision:
    study_id: str
    study_plan_version_id: str
    approved_by: str
    decision_comment: str | None = None


@dataclass(frozen=True)
class StartRunCommand:
    study_id: str
    study_plan_version_id: str
    requested_by: str


@dataclass(frozen=True)
class ResumeRunCommand:
    study_id: str
    study_run_id: str
    approved_by: str
    decision_comment: str | None = None


@dataclass(frozen=True)
class ImportAssetCommand:
    asset_kind: str
    name: str
    source_format: str
    storage_uri: str
    created_by: str
    metadata: dict[str, Any] = field(default_factory=dict)
    study_id: str | None = None


class StudyRuntimeRepository(Protocol):
    def create_study_bundle(self, command: CreateStudyCommand) -> dict[str, Any]:
        ...

    def get_study_bundle(self, study_id: str) -> dict[str, Any] | None:
        ...

    def get_plan_version(self, study_id: str, version_id: str) -> dict[str, Any] | None:
        ...

    def submit_plan_for_approval(self, study_id: str, version_id: str, requested_by: str) -> dict[str, Any]:
        ...

    def approve_plan(self, study_id: str, version_id: str, approved_by: str, decision_comment: str | None) -> dict[str, Any]:
        ...

    def create_run(self, study_id: str, version_id: str, requested_by: str) -> dict[str, Any]:
        ...

    def bind_workflow(self, run_id: str, workflow_id: str, workflow_run_id: str | None) -> None:
        ...

    def get_run(self, study_id: str, run_id: str) -> dict[str, Any] | None:
        ...

    def bootstrap_seed_assets(self) -> dict[str, Any]:
        ...

    def list_studies(self) -> list[dict[str, Any]]:
        ...

    def list_consumer_twins(self) -> list[dict[str, Any]]:
        ...

    def list_target_audiences(self) -> list[dict[str, Any]]:
        ...

    def list_persona_profiles(self) -> list[dict[str, Any]]:
        ...

    def list_twin_versions(self) -> list[dict[str, Any]]:
        ...

    def get_twin_versions(self, twin_version_ids: list[str]) -> list[dict[str, Any]]:
        ...

    def list_stimuli(self) -> list[dict[str, Any]]:
        ...

    def get_stimuli_by_ids(self, stimulus_ids: list[str]) -> list[dict[str, Any]]:
        ...

    def import_asset(self, command: ImportAssetCommand) -> dict[str, Any]:
        ...

    def list_ingestion_jobs(self) -> list[dict[str, Any]]:
        ...

    def list_dataset_mappings(self) -> list[dict[str, Any]]:
        ...


class StudyRuntimeWorkflowGateway(Protocol):
    def start_study_run(self, run_id: str, study_id: str, plan_version_id: str) -> dict[str, str | None]:
        ...

    def resume_study_run(self, workflow_id: str, approved_by: str, decision_comment: str | None) -> None:
        ...


class FakeWorkflowGateway:
    def __init__(self) -> None:
        self.started_runs: list[str] = []
        self.resumed_runs: list[str] = []

    def start_study_run(self, run_id: str, study_id: str, plan_version_id: str) -> dict[str, str | None]:
        self.started_runs.append(run_id)
        return {
            "workflow_id": f"study-run-{run_id}",
            "workflow_run_id": f"workflow-exec-{run_id}",
        }

    def resume_study_run(self, workflow_id: str, approved_by: str, decision_comment: str | None) -> None:
        self.resumed_runs.append(workflow_id)


class StudyRuntimeService:
    def __init__(
        self,
        *,
        repository: StudyRuntimeRepository,
        workflow_gateway: StudyRuntimeWorkflowGateway,
    ) -> None:
        self._repository = repository
        self._workflow_gateway = workflow_gateway

    def create_study(self, command: CreateStudyCommand) -> dict[str, Any]:
        return self._repository.create_study_bundle(command)

    def get_study_bundle(self, study_id: str) -> dict[str, Any]:
        bundle = self._repository.get_study_bundle(study_id)
        if bundle is None:
            raise AppError("Study not found", code="study_not_found", status_code=404)
        return bundle

    def submit_plan_for_approval(self, command: SubmitPlanForApprovalCommand) -> dict[str, Any]:
        version = self._require_plan_version(command.study_id, command.study_plan_version_id)
        if version["approval_status"] != "draft":
            raise AppError(
                "Only draft plan versions can be submitted for approval",
                code="invalid_plan_status",
                status_code=409,
            )
        return self._repository.submit_plan_for_approval(
            command.study_id,
            command.study_plan_version_id,
            command.requested_by,
        )

    def approve_plan(self, decision: ApprovalDecision) -> dict[str, Any]:
        version = self._require_plan_version(decision.study_id, decision.study_plan_version_id)
        if version["approval_status"] != "pending_approval":
            raise AppError(
                "Only pending plan versions can be approved",
                code="invalid_plan_status",
                status_code=409,
            )
        return self._repository.approve_plan(
            decision.study_id,
            decision.study_plan_version_id,
            decision.approved_by,
            decision.decision_comment,
        )

    def start_run(self, command: StartRunCommand) -> dict[str, Any]:
        version = self._require_plan_version(command.study_id, command.study_plan_version_id)
        if version["approval_status"] != "approved":
            raise AppError(
                "Study run can only start from an approved plan version",
                code="plan_not_approved",
                status_code=409,
            )
        run = self._repository.create_run(
            command.study_id,
            command.study_plan_version_id,
            command.requested_by,
        )
        workflow_ref = self._workflow_gateway.start_study_run(
            run["id"],
            command.study_id,
            command.study_plan_version_id,
        )
        self._repository.bind_workflow(
            run["id"],
            workflow_ref["workflow_id"] or f"study-run-{run['id']}",
            workflow_ref["workflow_run_id"],
        )
        return self._require_run(command.study_id, run["id"])

    def resume_run(self, command: ResumeRunCommand) -> dict[str, Any]:
        run = self._require_run(command.study_id, command.study_run_id)
        workflow_id = run.get("workflow_id")
        if not workflow_id:
            raise AppError("Study run has no workflow binding", code="workflow_missing", status_code=409)
        self._workflow_gateway.resume_study_run(
            workflow_id,
            command.approved_by,
            command.decision_comment,
        )
        return self._require_run(command.study_id, command.study_run_id)

    def get_run(self, study_id: str, run_id: str) -> dict[str, Any]:
        return self._require_run(study_id, run_id)

    def bootstrap_seed_assets(self) -> dict[str, Any]:
        return self._repository.bootstrap_seed_assets()

    def list_studies(self) -> list[dict[str, Any]]:
        return self._repository.list_studies()

    def get_study_detail(self, study_id: str) -> dict[str, Any]:
        bundle = self.get_study_bundle(study_id)
        latest_version = max(
            bundle.get("plan_versions", []),
            key=lambda item: item.get("version_no", 0),
            default=None,
        )
        twin_ids = [str(item) for item in (latest_version or {}).get("twin_version_ids", [])]
        stimulus_ids = [str(item) for item in (latest_version or {}).get("stimulus_ids", [])]
        twins = self._repository.get_twin_versions(twin_ids)
        stimuli = self._repository.get_stimuli_by_ids(stimulus_ids)
        return build_study_detail_projection(bundle, twins=twins, stimuli=stimuli)

    def list_consumer_twins(self) -> list[dict[str, Any]]:
        return self._repository.list_consumer_twins()

    def list_target_audiences(self) -> list[dict[str, Any]]:
        return self._repository.list_target_audiences()

    def list_persona_profiles(self) -> list[dict[str, Any]]:
        return self._repository.list_persona_profiles()

    def list_twin_versions(self) -> list[dict[str, Any]]:
        return self._repository.list_twin_versions()

    def list_stimuli(self) -> list[dict[str, Any]]:
        return self._repository.list_stimuli()

    def import_asset(self, command: ImportAssetCommand) -> dict[str, Any]:
        return self._repository.import_asset(command)

    def list_ingestion_jobs(self) -> list[dict[str, Any]]:
        return self._repository.list_ingestion_jobs()

    def list_dataset_mappings(self) -> list[dict[str, Any]]:
        return self._repository.list_dataset_mappings()

    def _require_plan_version(self, study_id: str, version_id: str) -> dict[str, Any]:
        version = self._repository.get_plan_version(study_id, version_id)
        if version is None:
            raise AppError("Study plan version not found", code="plan_version_not_found", status_code=404)
        return version

    def _require_run(self, study_id: str, run_id: str) -> dict[str, Any]:
        run = self._repository.get_run(study_id, run_id)
        if run is None:
            raise AppError("Study run not found", code="study_run_not_found", status_code=404)
        return run
