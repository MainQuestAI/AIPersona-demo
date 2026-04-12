from __future__ import annotations

from collections import defaultdict
from typing import Any, Optional


def _latest_plan_version(plan_versions: list[dict[str, Any]]) -> Optional[dict[str, Any]]:
    return max(plan_versions, key=lambda item: item.get("version_no", 0), default=None)


def _latest_run(study_runs: list[dict[str, Any]]) -> Optional[dict[str, Any]]:
    return max(study_runs, key=lambda item: item.get("created_at", ""), default=None)


def _summarize_plan_version(record: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if record is None:
        return None
    return {
        "id": str(record["id"]),
        "version_no": record.get("version_no"),
        "approval_status": record.get("approval_status"),
        "status": record.get("status"),
        "approval_required": record.get("approval_required"),
        "generated_by": record.get("generated_by"),
        "estimated_cost": record.get("estimated_cost"),
        "stimulus_count": len(record.get("stimulus_ids", [])),
        "twin_count": len(record.get("twin_version_ids", [])),
        "stimulus_ids": [str(item) for item in record.get("stimulus_ids", [])],
        "twin_version_ids": [str(item) for item in record.get("twin_version_ids", [])],
        "created_at": record.get("created_at"),
        "qual_config": record.get("qual_config_json", {}),
        "quant_config": record.get("quant_config_json", {}),
        "business_goal": record.get("business_goal_json", {}),
    }


def _summarize_run(record: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if record is None:
        return None
    approval_gates = record.get("approval_gates", [])
    latest_approval = approval_gates[-1] if approval_gates else None
    return {
        "id": str(record["id"]),
        "study_plan_version_id": str(record.get("study_plan_version_id")),
        "status": record.get("status"),
        "workflow_id": record.get("workflow_id"),
        "workflow_run_id": record.get("workflow_run_id"),
        "step_count": len(record.get("run_steps", [])),
        "approval_status": latest_approval.get("status") if latest_approval else None,
        "steps": [
            {
                "step_type": step.get("step_type"),
                "status": step.get("status"),
                "started_at": step.get("started_at"),
                "ended_at": step.get("ended_at"),
            }
            for step in record.get("run_steps", [])
        ],
        "created_at": record.get("created_at"),
        "updated_at": record.get("updated_at"),
    }


def _ready_artifacts(bundle: dict[str, Any]) -> list[dict[str, Any]]:
    raw_artifacts = bundle.get("artifacts", [])
    return [
        {
            "id": str(a["id"]),
            "artifact_type": a.get("artifact_type"),
            "format": a.get("format"),
            "status": a.get("status"),
            "manifest": a.get("artifact_manifest_json"),
            "created_at": a.get("created_at"),
        }
        for a in raw_artifacts
        if a.get("status") == "ready"
    ]


def _latest_artifact_of_type(artifacts: list[dict[str, Any]], artifact_type: str) -> dict[str, Any] | None:
    candidates = [artifact for artifact in artifacts if artifact.get("artifact_type") == artifact_type]
    return max(candidates, key=lambda item: item.get("created_at", ""), default=None)


def _build_cost_summary(
    latest_plan_version: Optional[dict[str, Any]],
    artifacts: list[dict[str, Any]],
) -> dict[str, Any]:
    total_prompt_tokens = 0
    total_completion_tokens = 0
    total_cost = 0.0
    usage_by_model: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"prompt_tokens": 0, "completion_tokens": 0, "cost": 0.0}
    )

    for artifact in artifacts:
        manifest = artifact.get("manifest", {})
        usage = manifest.get("usage") if isinstance(manifest, dict) else None
        if not isinstance(usage, dict):
            continue
        prompt_tokens = int(usage.get("prompt_tokens", 0) or 0)
        completion_tokens = int(usage.get("completion_tokens", 0) or 0)
        cost = float(usage.get("cost_estimate", 0) or 0)
        model = str(usage.get("model") or "unknown")

        total_prompt_tokens += prompt_tokens
        total_completion_tokens += completion_tokens
        total_cost += cost
        usage_by_model[model]["prompt_tokens"] += prompt_tokens
        usage_by_model[model]["completion_tokens"] += completion_tokens
        usage_by_model[model]["cost"] += cost

    return {
        "estimated_cost": latest_plan_version.get("estimated_cost") if latest_plan_version else None,
        "actual_cost": f"{total_cost:.2f}" if total_cost else None,
        "total_prompt_tokens": total_prompt_tokens,
        "total_completion_tokens": total_completion_tokens,
        "usage_by_model": [
            {"model": model, **payload}
            for model, payload in sorted(usage_by_model.items(), key=lambda item: item[0])
        ],
    }


def _build_insights(artifacts: list[dict[str, Any]], study_runs: list[dict[str, Any]]) -> dict[str, Any]:
    qual = _latest_artifact_of_type(artifacts, "qual_transcript")
    quant = _latest_artifact_of_type(artifacts, "quant_ranking")
    recommendation = _latest_artifact_of_type(artifacts, "recommendation")
    replay = _latest_artifact_of_type(artifacts, "replay")
    confidence = _latest_artifact_of_type(artifacts, "confidence_snapshot")

    replay_manifest = replay["manifest"] if replay else None
    if replay_manifest is None:
        latest_run = _latest_run(study_runs)
        replay_manifest = {
            "title": "Runtime replay",
            "stages": [
                {
                    "id": step.get("step_type"),
                    "label": step.get("step_type"),
                    "inputs": [],
                    "outputs": [step.get("status")],
                    "decisions": [],
                }
                for step in latest_run.get("run_steps", [])
            ] if latest_run else [],
        }

    return {
        "qual": qual["manifest"] if qual else {},
        "quant": quant["manifest"] if quant else {},
        "recommendation": recommendation["manifest"] if recommendation else {},
        "replay": replay_manifest,
        "confidence": confidence["manifest"] if confidence else {},
    }


def build_workbench_projection(
    bundle: dict[str, Any],
    *,
    twins: list[dict[str, Any]] | None = None,
    stimuli: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    plan_versions = bundle.get("plan_versions", [])
    study_runs = bundle.get("study_runs", [])
    latest_plan_version = _latest_plan_version(plan_versions)
    current_run = _latest_run(study_runs)
    artifacts = _ready_artifacts(bundle)

    return {
        "study": {
            "id": str(bundle["study"]["id"]),
            "business_question": bundle["study"].get("business_question"),
            "study_type": bundle["study"].get("study_type"),
            "brand": bundle["study"].get("brand"),
            "category": bundle["study"].get("category"),
            "target_groups": bundle["study"].get("target_groups", []),
            "status": bundle["study"].get("status"),
        },
        "plan": {
            "id": str(bundle["study_plan"]["id"]),
            "draft_status": bundle["study_plan"].get("draft_status"),
            "current_draft_version_id": bundle["study_plan"].get("current_draft_version_id"),
            "latest_approved_version_id": bundle["study_plan"].get("latest_approved_version_id"),
            "current_execution_version_id": bundle["study_plan"].get("current_execution_version_id"),
        },
        "latest_plan_version": _summarize_plan_version(latest_plan_version),
        "current_run": _summarize_run(current_run),
        "recent_runs": [_summarize_run(run) for run in study_runs[:5]],
        "artifacts": artifacts,
        "insights": _build_insights(artifacts, study_runs),
        "approval_gates": [
            {
                "id": str(gate["id"]),
                "scope_type": gate.get("scope_type"),
                "approval_type": gate.get("approval_type"),
                "status": gate.get("status"),
                "approved_by": gate.get("approved_by"),
                "decision_comment": gate.get("decision_comment"),
                "created_at": gate.get("created_at"),
                "updated_at": gate.get("updated_at"),
            }
            for gate in bundle.get("approval_gates", [])
        ],
        "twins": twins or [],
        "stimuli": stimuli or [],
        "cost_summary": _build_cost_summary(_summarize_plan_version(latest_plan_version), artifacts),
        "summary": {
            "total_plan_versions": len(plan_versions),
            "total_runs": len(study_runs),
            "approved_plan_versions": sum(
                1 for version in plan_versions if version.get("approval_status") == "approved"
            ),
        },
    }


def build_study_detail_projection(
    bundle: dict[str, Any],
    *,
    twins: list[dict[str, Any]] | None = None,
    stimuli: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    plan_versions = bundle.get("plan_versions", [])
    study_runs = bundle.get("study_runs", [])
    latest_plan_version = _summarize_plan_version(_latest_plan_version(plan_versions))
    current_run = _summarize_run(_latest_run(study_runs))
    artifacts = _ready_artifacts(bundle)
    workbench = build_workbench_projection(bundle, twins=twins, stimuli=stimuli)

    return {
        **workbench,
        "study": {
            "id": str(bundle["study"]["id"]),
            "business_question": bundle["study"].get("business_question"),
            "study_type": bundle["study"].get("study_type"),
            "brand": bundle["study"].get("brand"),
            "category": bundle["study"].get("category"),
            "target_groups": bundle["study"].get("target_groups", []),
            "status": bundle["study"].get("status"),
        },
        "planning": {
            "plan_id": str(bundle["study_plan"]["id"]),
            "draft_status": bundle["study_plan"].get("draft_status"),
            "current_execution_version_id": bundle["study_plan"].get("current_execution_version_id"),
            "latest_plan_version": latest_plan_version,
            "versions": [_summarize_plan_version(item) for item in plan_versions],
            "approval_history": bundle.get("approval_gates", []),
        },
        "execution": {
            "current_run": current_run,
            "recent_runs": [_summarize_run(run) for run in study_runs[:5]],
            "cost_summary": _build_cost_summary(latest_plan_version, artifacts),
        },
        "insights": _build_insights(artifacts, study_runs),
        "assets": {
            "twins": twins or [],
            "stimuli": stimuli or [],
        },
        "artifacts": artifacts,
    }
