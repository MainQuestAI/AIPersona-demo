from __future__ import annotations

from decimal import Decimal
from typing import Any, Optional

import json
import os

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
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


@router.get("/studies/{study_id}/report")
async def download_study_report(
    study_id: str,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> HTMLResponse:
    """Download the study report as an HTML file."""
    bundle = service.get_study_bundle(study_id)
    artifacts = bundle.get("artifacts", [])
    report_artifact = next(
        (a for a in artifacts if a.get("artifact_type") == "report" and a.get("status") == "ready"),
        None,
    )
    if not report_artifact:
        raise HTTPException(status_code=404, detail="报告尚未生成")
    manifest = report_artifact.get("artifact_manifest_json", {})
    html_content = manifest.get("html", "<p>报告内容为空</p>")
    return HTMLResponse(
        content=html_content,
        headers={"Content-Disposition": f'attachment; filename="study-report-{study_id[:8]}.html"'},
    )


class ChatMessage(BaseModel):
    role: str = Field(pattern=r"^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)


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
        history_messages = [
            {"role": m.role, "content": m.content}
            for m in payload.history[-10:]
        ]
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
                *history_messages,
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


# ---------------------------------------------------------------------------
#  Agent-driven conversation endpoints
# ---------------------------------------------------------------------------

@router.get("/studies/{study_id}/agent/messages")
async def get_agent_messages(
    study_id: str,
    after: str | None = None,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    """Poll for agent conversation messages."""
    messages = service.repository.get_study_messages(study_id, after_id=after)
    return {"messages": messages}


class AgentReplyRequest(BaseModel):
    action_id: str = ""
    action: str = Field(min_length=1, max_length=4000)
    comment: str | None = None


@router.post("/studies/{study_id}/agent/reply")
async def reply_to_agent(
    request: Request,
    study_id: str,
    payload: AgentReplyRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    """User replies to an agent action_request or sends a free-form message."""
    # Write user message
    service.repository.create_study_message(
        study_id, "user", payload.action,
        message_type="action_response" if payload.action_id else "text",
        metadata={"action_id": payload.action_id} if payload.action_id else {},
    )

    bundle = service.get_study_bundle(study_id)
    current_run = None
    for run in bundle.get("study_runs", []):
        if run.get("status") in ("running", "queued", "awaiting_midrun_approval"):
            current_run = run
            break

    # Handle action-based replies
    if payload.action_id == "midrun_review" and current_run:
        workflow_id = current_run.get("workflow_id")
        if workflow_id:
            service.gateway.resume_study_run(
                workflow_id=workflow_id,
                approved_by="boss",
                decision_comment=payload.comment or payload.action,
            )
            return {"status": "resumed"}

    if payload.action_id == "post_study":
        # Post-study actions handled by frontend (download, navigate)
        return {"status": "ok"}

    # Free-form chat: call LLM with study context
    if not payload.action_id:
        projection = build_workbench_projection(bundle)
        artifacts = projection.get("artifacts", [])
        context_parts = [f"研究问题：{projection['study'].get('business_question', '未知')}"]
        for artifact in artifacts:
            manifest = artifact.get("manifest", {})
            a_type = artifact.get("artifact_type", "")
            if a_type == "qual_transcript":
                themes = manifest.get("themes", {})
                if isinstance(themes, dict):
                    context_parts.append(f"定性主题：{json.dumps(themes.get('themes', []), ensure_ascii=False)}")
                    context_parts.append(f"整体洞察：{themes.get('overall_insight', '')}")
            elif a_type == "quant_ranking":
                for r in manifest.get("ranking", []):
                    context_parts.append(f"排名：{r.get('stimulus_name', '')} 得分 {r.get('score', 0)}")
            elif a_type == "recommendation":
                context_parts.append(f"推荐：{manifest.get('winner', '')} — {manifest.get('supporting_text', '')}")

        # Get recent messages for multi-turn context
        recent_messages = service.repository.get_study_messages(study_id)
        history = [
            {"role": m["role"] if m["role"] != "agent" else "assistant", "content": m["content"]}
            for m in recent_messages[-10:]
            if m["role"] in ("user", "agent") and m.get("message_type") in ("text", "action_response")
        ]

        settings = request.app.state.settings
        api_key = settings.dashscope_api_key
        model = settings.dashscope_model
        if not api_key:
            reply_text = "AI 对话服务未配置。"
        else:
            client = OpenAI(api_key=api_key, base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": (
                            "你是 AI 消费者研究助手。基于研究数据回答问题，专业、简洁，引用具体数据。\n\n"
                            + "\n".join(context_parts)
                        )},
                        *history,
                        {"role": "user", "content": payload.action},
                    ],
                    max_tokens=2048,
                    temperature=0.7,
                )
                reply_text = (response.choices[0].message.content if response.choices else None) or "暂时无法回答。"
            except Exception as exc:
                logger.warning("agent_chat_error study_id=%s error=%s", study_id, exc)
                reply_text = "AI 服务暂时不可用，请稍后再试。"

        service.repository.create_study_message(study_id, "agent", reply_text)
        return {"status": "ok", "reply": reply_text}

    return {"status": "ok"}


@router.post("/studies/{study_id}/agent/start")
async def start_agent(
    study_id: str,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    """Start agent-driven study execution."""
    bundle = service.get_study_bundle(study_id)
    study = bundle.get("study", {})
    plan = bundle.get("study_plan", {})

    # Find approved version
    versions = bundle.get("study_plan_versions", [])
    approved_version = None
    for v in versions:
        if v.get("approval_status") in ("approved", "active"):
            approved_version = v
            break
    if not approved_version:
        # Auto-approve: submit + approve if in draft/pending state
        latest_version = versions[0] if versions else None
        if latest_version:
            v_id = str(latest_version["id"])
            status = latest_version.get("approval_status", "draft")
            if status == "draft":
                service.submit_plan_for_approval(SubmitPlanForApprovalCommand(study_id=study_id, version_id=v_id, requested_by="boss"))
            service.approve_plan(ApprovalDecision(study_id=study_id, version_id=v_id, approved_by="boss", decision_comment="Auto-approved by agent"))
            approved_version = latest_version

    if not approved_version:
        raise HTTPException(status_code=400, detail="No plan version available")

    # Create run
    run = service.start_run(
        StartRunCommand(
            study_id=study_id,
            study_plan_version_id=str(approved_version["id"]),
            requested_by="boss",
        ),
        workflow_type="agent",
    )

    # Post initial agent message
    service.repository.create_study_message(
        study_id, "agent",
        f"你好！我是你的 AI 研究助手。\n\n"
        f"我已收到你的研究问题：**{study.get('business_question', '未命名')}**\n\n"
        f"正在准备研究执行环境...",
    )

    return {"status": "started", "run_id": str(run.get("id", ""))}
