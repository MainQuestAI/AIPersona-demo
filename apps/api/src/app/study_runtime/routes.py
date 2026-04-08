from __future__ import annotations

from decimal import Decimal
from typing import Any, Optional

import json
import os

from fastapi import APIRouter, Depends, Request
from openai import OpenAI
from pydantic import BaseModel, Field

from app.study_runtime.projections import build_workbench_projection
from app.study_runtime.gateway import TemporalStudyRuntimeWorkflowGateway
from app.study_runtime.repository import PostgresStudyRuntimeRepository
from app.study_runtime.service import (
    ApprovalDecision,
    CreateStudyCommand,
    ImportAssetCommand,
    ResumeRunCommand,
    StartRunCommand,
    StudyRuntimeService,
    SubmitPlanForApprovalCommand,
)


router = APIRouter(tags=["study-runtime"])


class CreateStudyRequest(BaseModel):
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
    owner_team_id: Optional[str] = None
    anchor_set_id: Optional[str] = None
    agent_config_ids: list[str] = Field(default_factory=list)
    estimated_cost: Optional[Decimal] = None
    approval_required: bool = True


class DecisionRequest(BaseModel):
    actor: str
    decision_comment: Optional[str] = None


class StartRunRequest(BaseModel):
    study_plan_version_id: str
    requested_by: str


class AssetImportRequest(BaseModel):
    asset_kind: str
    name: str
    source_format: str
    storage_uri: str
    created_by: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    study_id: Optional[str] = None


def get_study_runtime_service(request: Request) -> StudyRuntimeService:
    settings = request.app.state.settings
    repository = PostgresStudyRuntimeRepository(settings.database_url)
    workflow_gateway = TemporalStudyRuntimeWorkflowGateway(
        temporal_target=settings.temporal_target,
        namespace=settings.temporal_namespace,
        task_queue=settings.temporal_task_queue,
    )
    return StudyRuntimeService(
        repository=repository,
        workflow_gateway=workflow_gateway,
    )


@router.post("/studies")
async def create_study(
    payload: CreateStudyRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    return service.create_study(CreateStudyCommand(**payload.model_dump()))


@router.get("/studies")
async def list_studies(
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> list[dict[str, Any]]:
    return service.list_studies()


@router.get("/studies/{study_id}")
async def get_study_bundle(
    study_id: str,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    return service.get_study_bundle(study_id)


@router.get("/studies/{study_id}/detail")
async def get_study_detail(
    study_id: str,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    return service.get_study_detail(study_id)


@router.get("/studies/{study_id}/workbench")
async def get_workbench_projection(
    study_id: str,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    return build_workbench_projection(service.get_study_bundle(study_id))


@router.post("/studies/{study_id}/plan-versions/{version_id}/submit")
async def submit_plan_for_approval(
    study_id: str,
    version_id: str,
    payload: DecisionRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    return service.submit_plan_for_approval(
        SubmitPlanForApprovalCommand(
            study_id=study_id,
            study_plan_version_id=version_id,
            requested_by=payload.actor,
        )
    )


@router.post("/studies/{study_id}/plan-versions/{version_id}/approve")
async def approve_plan(
    study_id: str,
    version_id: str,
    payload: DecisionRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    return service.approve_plan(
        ApprovalDecision(
            study_id=study_id,
            study_plan_version_id=version_id,
            approved_by=payload.actor,
            decision_comment=payload.decision_comment,
        )
    )


@router.post("/studies/{study_id}/runs")
async def start_run(
    study_id: str,
    payload: StartRunRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    return service.start_run(
        StartRunCommand(
            study_id=study_id,
            study_plan_version_id=payload.study_plan_version_id,
            requested_by=payload.requested_by,
        )
    )


@router.get("/studies/{study_id}/runs/{run_id}")
async def get_run(
    study_id: str,
    run_id: str,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    return service.get_run(study_id, run_id)


@router.post("/studies/{study_id}/runs/{run_id}/resume")
async def resume_run(
    study_id: str,
    run_id: str,
    payload: DecisionRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    return service.resume_run(
        ResumeRunCommand(
            study_id=study_id,
            study_run_id=run_id,
            approved_by=payload.actor,
            decision_comment=payload.decision_comment,
        )
    )


@router.post("/bootstrap/seed-assets")
async def bootstrap_seed_assets(
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    return service.bootstrap_seed_assets()


@router.get("/consumer-twins")
async def list_consumer_twins(
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> list[dict[str, Any]]:
    return service.list_consumer_twins()


@router.get("/target-audiences")
async def list_target_audiences(
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> list[dict[str, Any]]:
    return service.list_target_audiences()


@router.get("/persona-profiles")
async def list_persona_profiles(
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> list[dict[str, Any]]:
    return service.list_persona_profiles()


@router.get("/twin-versions")
async def list_twin_versions(
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> list[dict[str, Any]]:
    return service.list_twin_versions()


@router.get("/stimuli")
async def list_stimuli(
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> list[dict[str, Any]]:
    return service.list_stimuli()


@router.post("/assets/import")
async def import_asset(
    payload: AssetImportRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    return service.import_asset(ImportAssetCommand(**payload.model_dump()))


@router.get("/ingestion/jobs")
async def list_ingestion_jobs(
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> list[dict[str, Any]]:
    return service.list_ingestion_jobs()


@router.get("/datasets/mappings")
async def list_dataset_mappings(
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> list[dict[str, Any]]:
    return service.list_dataset_mappings()


@router.get("/benchmark-packs")
async def list_benchmark_packs() -> list[dict[str, Any]]:
    return []


@router.get("/calibration-runs")
async def list_calibration_runs() -> list[dict[str, Any]]:
    return []


@router.get("/confidence-snapshots")
async def list_confidence_snapshots() -> list[dict[str, Any]]:
    return []


@router.get("/drift-alerts")
async def list_drift_alerts() -> list[dict[str, Any]]:
    return []


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


@router.post("/studies/{study_id}/chat")
async def chat_with_study(
    request: Request,
    study_id: str,
    payload: ChatRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, str]:
    """Chat about a study using its research artifacts as context."""
    bundle = service.get_study_bundle(study_id)
    projection = build_workbench_projection(bundle)

    # Build context from artifacts
    artifacts = projection.get("artifacts", [])
    context_parts: list[str] = []
    context_parts.append(f"研究问题：{projection['study'].get('business_question', '未知')}")
    context_parts.append(f"研究状态：{projection['study'].get('status', '未知')}")

    for artifact in artifacts:
        manifest = artifact.get("manifest", {})
        a_type = artifact.get("artifact_type", "")
        if a_type == "qual_transcript":
            themes = manifest.get("themes", {})
            if isinstance(themes, dict):
                context_parts.append(f"定性主题：{json.dumps(themes.get('themes', []), ensure_ascii=False)}")
                context_parts.append(f"整体洞察：{themes.get('overall_insight', '')}")
        elif a_type == "quant_ranking":
            ranking = manifest.get("ranking", [])
            for r in ranking:
                context_parts.append(f"排名：{r.get('stimulus_name', '')} 得分 {r.get('score', 0)}")
        elif a_type == "recommendation":
            context_parts.append(f"推荐结论：{manifest.get('winner', '')} — {manifest.get('supporting_text', '')}")

    research_context = "\n".join(context_parts)

    settings = request.app.state.settings
    api_key = settings.dashscope_api_key
    model = settings.dashscope_model

    if not api_key:
        return {"reply": "AI 对话服务未配置，请联系管理员。"}

    client = OpenAI(
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "你是 AI 消费者研究工作台的研究助手。用户正在查看一项消费者研究的结果。\n"
                        "基于以下研究数据回答用户的问题。回答要专业、简洁，引用具体数据。\n"
                        "如果研究数据不足以回答问题，诚实说明。\n\n"
                        f"研究数据：\n{research_context}"
                    ),
                },
                {"role": "user", "content": payload.message},
            ],
            max_tokens=2048,
            temperature=0.7,
        )
        reply = response.choices[0].message.content if response.choices else None
        return {"reply": reply or "抱歉，AI 暂时无法回答您的问题。"}
    except Exception as exc:
        logger.warning("chat_llm_error study_id=%s error=%s", study_id, exc)
        return {"reply": "AI 服务暂时不可用，请稍后再试。"}
