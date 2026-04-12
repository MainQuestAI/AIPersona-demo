from __future__ import annotations

import hashlib
import logging
import secrets
from decimal import Decimal
from typing import Any, Optional

import json
import os

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse
from openai import OpenAI
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

from app.study_runtime.projections import build_workbench_projection
from app.study_runtime.gateway import LangGraphStudyGateway
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
    workflow_gateway = LangGraphStudyGateway(
        database_url=settings.database_url,
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


class GeneratePersonaRequest(BaseModel):
    text: str = Field(min_length=50, max_length=50000)
    audience_label: str = Field(min_length=2, max_length=100)


@router.post("/persona-profiles/generate")
async def generate_persona(
    request: Request,
    payload: GeneratePersonaRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    """Generate a persona from interview text using LLM, then create the full twin chain."""
    settings = request.app.state.settings
    api_key = settings.dashscope_api_key
    model = settings.dashscope_model

    if not api_key:
        raise HTTPException(status_code=503, detail="AI 服务未配置")

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
                        "你是消费者研究专家。从访谈文本中提取消费者画像。"
                        "返回严格 JSON（不要 markdown 代码块），包含以下字段：\n"
                        '{"name": "画像名称·昵称", "age_range": "年龄区间", '
                        '"demographics": {"gender": "性别", "age": 数字, "income": "收入描述", "education": "学历", "occupation": "职业"}, '
                        '"geographic": {"city": "城市", "tier": "城市线级", "region": "区域", "residence": "居住区域"}, '
                        '"behavioral": {"shopping_channel": "购物渠道", "info_source": "信息来源", "purchase_frequency": "购买频率", "brand_loyalty": "品牌忠诚度"}, '
                        '"psychological": {"core_value": "核心价值观", "anxiety_level": "焦虑水平", "decision_style": "决策风格", "self_identity": "自我认同"}, '
                        '"needs": {"primary": "主要需求", "secondary": "次要需求", "unmet": "未满足需求"}, '
                        '"tech_acceptance": {"digital_literacy": "数字素养", "app_usage": "常用App", "ai_attitude": "对AI态度"}, '
                        '"social_relations": {"family_influence": "家庭影响", "peer_influence": "同伴影响", "kol_influence": "KOL影响"}, '
                        '"system_prompt": "用于模拟该消费者的 system prompt（第一人称，200字以内）"}'
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"目标人群：{payload.audience_label}\n\n"
                        f"访谈文本：\n{payload.text[:8000]}"
                    ),
                },
            ],
            max_tokens=2048,
            temperature=0.3,
        )
        raw = response.choices[0].message.content if response.choices else None
        if not raw:
            raise HTTPException(status_code=502, detail="LLM 返回为空")

        # Parse JSON from response (strip markdown fences if present)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        profile_data = json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="LLM 返回的 JSON 无法解析")
    except Exception as exc:
        logger.warning("generate_persona_llm_error: %s", exc)
        raise HTTPException(status_code=502, detail="AI 服务调用失败")

    # Build the full persona chain: target_audience → persona_profile → consumer_twin → twin_version
    result = service.repository.create_persona_chain(
        audience_label=payload.audience_label,
        profile_data=profile_data,
    )
    return result


class BatchGenerateRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=20)
    audience_label: str = Field(min_length=2, max_length=100)
    source: str = "social_media"


# Limit concurrent LLM calls for batch generation
_BATCH_CONCURRENCY = 3

@router.post("/persona-profiles/generate-batch")
async def generate_persona_batch(
    request: Request,
    payload: BatchGenerateRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    """Batch-generate personas from multiple social media texts (max 20, 3 concurrent)."""
    import asyncio

    results: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    sem = asyncio.Semaphore(_BATCH_CONCURRENCY)

    async def _process_one(i: int, text: str) -> None:
        if len(text.strip()) < 30:
            errors.append({"index": i, "error": "文本不足 30 字，已跳过"})
            return
        async with sem:
            try:
                single_payload = GeneratePersonaRequest(
                    text=text[:50000],
                    audience_label=payload.audience_label,
                )
                result = await generate_persona(request, single_payload, service)
                results.append(result)
            except Exception as exc:
                errors.append({"index": i, "error": str(exc)})

    await asyncio.gather(*[_process_one(i, t) for i, t in enumerate(payload.texts)])

    return {
        "total": len(payload.texts),
        "created": len(results),
        "errors": errors,
        "personas": results,
    }


@router.post("/persona-profiles/upload")
async def upload_persona_pdf(
    request: Request,
    file: UploadFile = File(...),
    audience_label: str = "消费者",
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    """Upload a PDF file, extract text, and generate a persona via LLM."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="请上传 PDF 文件")

    try:
        import pdfplumber
    except ImportError:
        raise HTTPException(status_code=503, detail="PDF 解析库未安装（需要 pdfplumber）")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小不能超过 20MB")

    import io
    extracted_text = ""
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages[:50]:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
    except Exception as exc:
        logger.warning("pdf_extract_error: %s", exc)
        raise HTTPException(status_code=400, detail="PDF 文件解析失败")

    extracted_text = extracted_text.strip()
    if len(extracted_text) < 50:
        raise HTTPException(status_code=400, detail="PDF 中提取的文本不足 50 字，请上传内容更丰富的文件")

    # Reuse the LLM extraction logic from generate_persona
    payload_obj = GeneratePersonaRequest(text=extracted_text[:50000], audience_label=audience_label)
    return await generate_persona(request, payload_obj, service)


class PersonaChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=30)


@router.post("/persona-profiles/{profile_id}/chat")
async def chat_with_persona(
    request: Request,
    profile_id: str,
    payload: PersonaChatRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, str]:
    """Chat with a persona independently, outside of a study context."""
    profile = service.repository.get_persona_profile(profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Persona 画像不存在")

    profile_json = profile.get("profile_json", {})
    system_prompt = profile_json.get("system_prompt", "")
    name = profile_json.get("name", profile.get("label", "消费者"))
    audience_label = profile_json.get("audience_label", "")

    if not system_prompt:
        system_prompt = f"你是一位名为{name}的消费者，属于{audience_label}人群。请以第一人称回答问题，表现得像真实消费者。"

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
            for m in payload.history[-20:]
        ]
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                *history_messages,
                {"role": "user", "content": payload.message},
            ],
            max_tokens=1024,
            temperature=0.7,
        )
        reply = response.choices[0].message.content if response.choices else ""
        return {"reply": reply or "（无回复）"}
    except Exception as exc:
        logger.warning("persona_chat_error: %s", exc)
        return {"reply": "抱歉，对话服务暂时不可用，请稍后重试。"}


class SageChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=30)
    knowledge_context: str = ""


@router.post("/sage/chat")
async def sage_chat(
    request: Request,
    payload: SageChatRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, str]:
    """AI Sage: expert consultant that uses research knowledge to answer questions."""
    settings = request.app.state.settings
    api_key = settings.dashscope_api_key
    model = settings.dashscope_model

    if not api_key:
        return {"reply": "AI 服务未配置"}

    # Build knowledge context from memories + user-provided context
    knowledge_parts = []
    if payload.knowledge_context:
        knowledge_parts.append(f"用户提供的知识：\n{payload.knowledge_context}")

    try:
        memories = service.repository.list_recent_memories(limit=20)
        if memories:
            memory_text = "\n".join(f"- [{m['memory_type']}] {m['key']}: {m['value']}" for m in memories)
            knowledge_parts.append(f"历史研究记忆：\n{memory_text}")
    except Exception:
        pass

    knowledge = "\n\n".join(knowledge_parts) if knowledge_parts else "暂无知识库数据。"

    client = OpenAI(api_key=api_key, base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")
    try:
        history_messages = [{"role": m.role, "content": m.content} for m in payload.history[-20:]]
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "你是 AI Sage，一位资深消费者研究专家和战略顾问。\n"
                        "你基于积累的研究知识库来回答问题，提供专业的消费者洞察和战略建议。\n"
                        "回答风格：专业但易懂，引用具体数据和案例，给出可执行的建议。\n"
                        "如果知识库中没有相关信息，诚实说明并提供基于通用消费者研究方法论的建议。\n\n"
                        f"知识库：\n{knowledge}"
                    ),
                },
                *history_messages,
                {"role": "user", "content": payload.message},
            ],
            max_tokens=2048,
            temperature=0.7,
        )
        reply = response.choices[0].message.content if response.choices else ""
        return {"reply": reply or "暂时无法回答"}
    except Exception as exc:
        logger.warning("sage_chat_error: %s", exc)
        return {"reply": "抱歉，AI Sage 暂时不可用。"}


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


@router.get("/memories")
async def list_all_memories(
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> list[dict[str, Any]]:
    """List all active study memories across all studies."""
    try:
        return service.repository.list_all_memories()
    except Exception:
        return []  # Memory table may not exist yet


@router.get("/studies/{study_id}/memories")
async def list_study_memories(
    study_id: str,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> list[dict[str, Any]]:
    """List memories extracted from a specific study."""
    try:
        return service.repository.list_study_memories(study_id)
    except Exception:
        return []


@router.post("/studies/{study_id}/podcast")
async def generate_podcast(
    request: Request,
    study_id: str,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, Any]:
    """Generate an AI podcast script from research findings using LLM."""
    bundle = service.get_study_bundle(study_id)
    projection = build_workbench_projection(bundle)
    bq = projection["study"].get("business_question", "未知")

    # Collect research data
    artifacts = projection.get("artifacts", [])
    context_parts = [f"研究问题：{bq}"]
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
            context_parts.append(f"推荐方案：{manifest.get('winner', '')} — {manifest.get('supporting_text', '')}")

    research_context = "\n".join(context_parts)

    settings = request.app.state.settings
    api_key = settings.dashscope_api_key
    model = settings.dashscope_model
    if not api_key:
        raise HTTPException(status_code=503, detail="AI 服务未配置")

    client = OpenAI(api_key=api_key, base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "你是一位专业的消费者研究播客主持人。请将以下研究发现转化为一段 3-5 分钟的播客脚本。"
                        "风格：轻松专业，像在和听众聊天。"
                        "结构：开场白（引出研究问题）→ 核心发现（2-3 个亮点）→ 推荐结论 → 下一步行动建议。"
                        "用口语化的中文，加入过渡词和适当停顿标记（...）。"
                        "不要输出标题或格式标记，直接输出播客文本。"
                    ),
                },
                {"role": "user", "content": f"研究数据：\n{research_context}"},
            ],
            max_tokens=2048,
            temperature=0.8,
        )
        script = (response.choices[0].message.content if response.choices else None) or "播客生成失败"
    except Exception as exc:
        logger.warning("podcast_generate_error: %s", exc)
        raise HTTPException(status_code=502, detail="播客生成失败")

    return {
        "study_id": study_id,
        "script": script,
        "duration_estimate": f"{len(script) // 250} 分钟",
        "format": "text",
    }


@router.get("/studies/{study_id}/replay")
async def study_replay_page(
    study_id: str,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> HTMLResponse:
    """Public replay page showing research stages, decisions, and key moments."""
    bundle = service.get_study_bundle(study_id)
    projection = build_workbench_projection(bundle)
    bq = projection["study"].get("business_question", "未知")
    status = projection["study"].get("status", "未知")

    artifacts = projection.get("artifacts", [])
    stages_html = ""
    for artifact in artifacts:
        a_type = artifact.get("artifact_type", "")
        manifest = artifact.get("manifest", {})
        created = artifact.get("created_at", "")

        if a_type == "qual_transcript":
            themes = manifest.get("themes", {})
            theme_labels = themes.get("themes", []) if isinstance(themes, dict) else []
            insight = themes.get("overall_insight", "") if isinstance(themes, dict) else ""
            interview_count = manifest.get("twin_count", 0) * manifest.get("stimulus_count", 0)
            stages_html += f"""
            <div class="stage">
              <div class="stage-label">定性访谈</div>
              <div class="stage-meta">{interview_count} 场 AI 深度访谈 · {created[:10] if created else ''}</div>
              <div class="stage-themes">{'、'.join(str(t) for t in theme_labels[:5])}</div>
              <div class="stage-insight">{insight}</div>
            </div>"""
        elif a_type == "quant_ranking":
            ranking = manifest.get("ranking", [])
            ranking_html = "".join(
                f'<div class="rank-item"><span class="rank-pos">#{i+1}</span> '
                f'<span class="rank-name">{r.get("stimulus_name", "")}</span> '
                f'<span class="rank-score">{r.get("score", 0)} 分</span></div>'
                for i, r in enumerate(ranking)
            )
            stages_html += f"""
            <div class="stage">
              <div class="stage-label">综合评分</div>
              <div class="ranking">{ranking_html}</div>
            </div>"""
        elif a_type == "recommendation":
            winner = manifest.get("winner", "")
            supporting = manifest.get("supporting_text", "")
            stages_html += f"""
            <div class="stage stage-winner">
              <div class="stage-label">推荐结论</div>
              <div class="winner">{winner}</div>
              <div class="supporting">{supporting}</div>
            </div>"""

    html = f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>研究回放 — {bq[:50]}</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#030305;color:#e0e0e0;font-family:'Inter',system-ui,sans-serif;padding:2rem;max-width:800px;margin:0 auto}}
h1{{font-size:1.5rem;font-weight:600;color:#fff;margin-bottom:.5rem}}
.meta{{font-size:.75rem;color:#888;margin-bottom:2rem}}
.stage{{border:1px solid rgba(99,102,241,.2);border-radius:12px;padding:1.5rem;margin-bottom:1rem;
  background:rgba(99,102,241,.03)}}
.stage-winner{{border-color:rgba(99,102,241,.4);background:rgba(99,102,241,.08)}}
.stage-label{{font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:#6366f1;margin-bottom:.75rem;font-weight:600}}
.stage-meta{{font-size:.75rem;color:#888;margin-bottom:.5rem}}
.stage-themes{{font-size:.85rem;color:#ccc;margin-bottom:.5rem}}
.stage-insight{{font-size:.85rem;color:#aaa;line-height:1.6}}
.ranking{{display:flex;flex-direction:column;gap:.5rem}}
.rank-item{{display:flex;align-items:center;gap:.75rem;font-size:.85rem}}
.rank-pos{{color:#6366f1;font-weight:700;width:2rem}}
.rank-name{{color:#fff;font-weight:500;flex:1}}
.rank-score{{color:#6366f1;font-weight:600}}
.winner{{font-size:1.25rem;font-weight:700;color:#6366f1;margin-bottom:.5rem}}
.supporting{{font-size:.85rem;color:#aaa;line-height:1.6}}
.footer{{margin-top:2rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,.08);
  font-size:.65rem;color:#555;text-align:center}}
</style></head><body>
<h1>{bq}</h1>
<div class="meta">状态：{status} · AIpersona Research Replay</div>
{stages_html if stages_html else '<div class="stage"><div class="stage-label">暂无研究数据</div></div>'}
<div class="footer">Powered by AIpersona · 研究回放页面</div>
</body></html>"""

    return HTMLResponse(content=html, media_type="text/html")


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


@router.get("/studies/{study_id}/share")
async def share_study_results(
    study_id: str,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> HTMLResponse:
    """Public shareable view of study results. No auth required."""
    bundle = service.get_study_bundle(study_id)
    study = bundle.get("study", {})
    artifacts = bundle.get("artifacts", [])
    bq = study.get("business_question", "AI 消费者研究")

    rec_artifact = next((a for a in artifacts if a.get("artifact_type") == "recommendation" and a.get("status") == "ready"), None)
    quant_artifact = next((a for a in artifacts if a.get("artifact_type") == "quant_ranking" and a.get("status") == "ready"), None)

    if not rec_artifact:
        raise HTTPException(status_code=404, detail="研究尚未完成")

    rec = rec_artifact.get("artifact_manifest_json", {})
    winner = rec.get("winner", "待确认")
    confidence = rec.get("confidence_label", "-- / 中")
    supporting = rec.get("supporting_text", "")
    next_action = rec.get("next_action", "")

    ranking_html = ""
    if quant_artifact:
        ranking = quant_artifact.get("artifact_manifest_json", {}).get("ranking", [])
        rows = "".join(
            f'<tr><td style="padding:8px 12px;border-bottom:1px solid #1a1a2e">{i+1}</td>'
            f'<td style="padding:8px 12px;border-bottom:1px solid #1a1a2e;font-weight:600">{r.get("stimulus_name","")}</td>'
            f'<td style="padding:8px 12px;border-bottom:1px solid #1a1a2e;text-align:right">{r.get("score",0)}</td>'
            f'<td style="padding:8px 12px;border-bottom:1px solid #1a1a2e;text-align:right;color:#6366f1">{r.get("confidence_label","")}</td></tr>'
            for i, r in enumerate(ranking)
        )
        ranking_html = f"""
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <thead><tr style="color:#888;font-size:12px">
            <th style="padding:8px 12px;text-align:left">#</th>
            <th style="padding:8px 12px;text-align:left">概念</th>
            <th style="padding:8px 12px;text-align:right">得分</th>
            <th style="padding:8px 12px;text-align:right">置信度</th>
          </tr></thead>
          <tbody>{rows}</tbody>
        </table>"""

    import html as html_mod
    html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html_mod.escape(bq)} — AIpersona 研究结论</title>
<style>
  body {{ margin:0; padding:0; background:#030305; color:#e8e8ec; font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif; }}
  .container {{ max-width:640px; margin:0 auto; padding:32px 20px; }}
  .badge {{ display:inline-block; background:rgba(99,102,241,.12); border:1px solid rgba(99,102,241,.3); color:#6366f1; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; }}
  h1 {{ font-size:24px; margin:16px 0 8px; font-weight:700; letter-spacing:-0.02em; }}
  .winner {{ color:#6366f1; }}
  .supporting {{ color:#999; font-size:14px; line-height:1.7; margin:12px 0; }}
  .card {{ background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:20px; margin:20px 0; }}
  .label {{ font-size:11px; color:#666; text-transform:uppercase; letter-spacing:0.04em; }}
  .footer {{ margin-top:40px; padding-top:20px; border-top:1px solid rgba(255,255,255,.06); font-size:12px; color:#555; text-align:center; }}
</style>
</head>
<body>
<div class="container">
  <span class="badge">AIpersona 研究结论</span>
  <h1>{html_mod.escape(bq)}</h1>
  <div class="card">
    <div class="label">推荐方案</div>
    <div style="font-size:28px;font-weight:700;margin-top:8px" class="winner">{html_mod.escape(winner)}</div>
    <div style="margin-top:8px;font-size:13px;color:#6366f1">置信度 {html_mod.escape(confidence)}</div>
  </div>
  <p class="supporting">{html_mod.escape(supporting)}</p>
  {ranking_html}
  {f'<div class="card"><div class="label">建议下一步</div><div style="margin-top:8px;font-size:14px">{html_mod.escape(next_action)}</div></div>' if next_action else ''}
  <div class="footer">由 AIpersona AI 消费者研究工作台生成</div>
</div>
</body>
</html>"""

    return HTMLResponse(content=html_content)


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
    if payload.action_id == "confirm_plan":
        # User confirmed the plan — walk the full approval chain, then start workflow
        versions = bundle.get("plan_versions", [])
        latest_version = versions[-1] if versions else None
        if not latest_version:
            raise HTTPException(status_code=400, detail="No plan version to confirm")
        v_id = str(latest_version["id"])
        approval_status = latest_version.get("approval_status", "draft")
        if approval_status == "draft":
            service.submit_plan_for_approval(
                SubmitPlanForApprovalCommand(study_id=study_id, study_plan_version_id=v_id, requested_by="boss")
            )
        if approval_status in ("draft", "pending_approval"):
            service.approve_plan(
                ApprovalDecision(study_id=study_id, study_plan_version_id=v_id, approved_by="boss", decision_comment="Confirmed via agent")
            )
        run = service.start_run(
            StartRunCommand(study_id=study_id, study_plan_version_id=v_id, requested_by="boss"),
            workflow_type="agent",
        )
        return {"status": "started", "run_id": str(run.get("id", ""))}

    if payload.action_id == "edit_plan":
        # User wants to modify the plan configuration (twin/stimulus selection)
        try:
            edit_data = json.loads(payload.action) if payload.action.startswith("{") else {}
        except json.JSONDecodeError:
            edit_data = {}
        new_twin_ids = edit_data.get("twin_version_ids", [])
        new_stimulus_ids = edit_data.get("stimulus_ids", [])
        if not new_twin_ids and not new_stimulus_ids:
            return {"status": "error", "detail": "请提供新的 twin_version_ids 或 stimulus_ids"}

        # Create a new plan version with updated config
        versions = bundle.get("plan_versions", [])
        latest = versions[-1] if versions else {}
        new_version = service.repository.create_plan_version_from_edit(
            study_id=study_id,
            base_version=latest,
            twin_version_ids=new_twin_ids or [str(t) for t in latest.get("twin_version_ids", [])],
            stimulus_ids=new_stimulus_ids or [str(s) for s in latest.get("stimulus_ids", [])],
        )
        new_v_id = str(new_version["id"])

        # Re-present the plan
        twin_versions = service.repository.get_twin_versions(new_twin_ids or [str(t) for t in latest.get("twin_version_ids", [])])
        stimuli = service.repository.get_stimuli_by_ids(new_stimulus_ids or [str(s) for s in latest.get("stimulus_ids", [])])
        twin_labels = ", ".join(
            (tv.get("persona_profile_snapshot_json") or {}).get("name", "?") for tv in twin_versions
        ) or "待配置"
        stimuli_names = ", ".join(s.get("name", "?") for s in stimuli) or "待配置"
        total_idi = len(twin_versions) * len(stimuli)
        bq = bundle.get("study", {}).get("business_question", "")

        service.repository.create_study_message(
            study_id, "agent",
            f"## 计划已更新（v{new_version.get('version_no', '?')}）\n\n"
            f"**研究问题**：{bq}\n"
            f"**目标人群**：{len(twin_versions)} 个（{twin_labels}）\n"
            f"**刺激物**：{len(stimuli)} 个（{stimuli_names}）\n"
            f"**访谈场次**：{total_idi}\n\n"
            f"请确认后开始执行。",
            message_type="action_request",
            metadata={"actions": ["开始执行", "调整配置"], "action_id": "confirm_plan", "plan_version_id": new_v_id},
        )
        return {"status": "plan_updated", "plan_version_id": new_v_id}

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
    """Present research plan for user confirmation. Does NOT auto-approve or start workflow."""
    bundle = service.get_study_bundle(study_id)
    study = bundle.get("study", {})
    bq = study.get("business_question", "未命名研究")

    # Find latest plan version (any status)
    versions = bundle.get("plan_versions", [])
    if not versions:
        raise HTTPException(status_code=400, detail="No plan version available")
    latest_version = versions[-1]
    v_id = str(latest_version["id"])

    # Load twin and stimulus details for the plan message
    twin_version_ids = [str(tid) for tid in latest_version.get("twin_version_ids", [])]
    stimulus_ids = [str(sid) for sid in latest_version.get("stimulus_ids", [])]
    twin_versions = service.repository.get_twin_versions(twin_version_ids) if twin_version_ids else []
    stimuli = service.repository.get_stimuli_by_ids(stimulus_ids) if stimulus_ids else []

    twin_labels = ", ".join(
        (tv.get("persona_profile_snapshot_json") or {}).get("name", tv.get("target_audience_label", "?"))
        for tv in twin_versions
    ) or "待配置"
    stimuli_names = ", ".join(s.get("name", "?") for s in stimuli) or "待配置"

    total_idi = len(twin_versions) * len(stimuli)
    est_calls = total_idi * 5 + 1  # 5 LLM calls per multi-turn IDI + theme extraction
    est_minutes = max(1, (est_calls * 12 + 59) // 60)
    estimated_cost = latest_version.get("estimated_cost")
    cost_label = f"¥{estimated_cost}" if estimated_cost else "待估算"

    # Query historical memories for context injection
    memory_section = ""
    try:
        memories = service.repository.list_recent_memories(limit=10)
        if memories:
            memory_lines = []
            for m in memories:
                memory_lines.append(f"- **{m['key']}**：{m['value'][:120]}")
            memory_section = (
                "\n\n---\n**历史研究发现**（来自过往研究的自动提取记忆）：\n"
                + "\n".join(memory_lines)
                + "\n"
            )
    except Exception:
        pass  # Memory table may not exist yet

    # Post plan review message (action_request, user must confirm)
    service.repository.create_study_message(
        study_id, "agent",
        f"## 研究计划\n\n"
        f"**研究问题**：{bq}\n"
        f"**目标人群**：{len(twin_versions)} 个（{twin_labels}）\n"
        f"**刺激物**：{len(stimuli)} 个（{stimuli_names}）\n"
        f"**研究方法**：AI 深度访谈（{total_idi} 场）+ 多轮评分\n"
        f"**预计**：{est_calls} 次 AI 调用，约 {est_minutes} 分钟\n"
        f"**预算**：{cost_label}"
        f"{memory_section}\n\n"
        f"请确认后开始执行。",
        message_type="action_request",
        metadata={"actions": ["开始执行", "调整配置"], "action_id": "confirm_plan", "plan_version_id": v_id},
    )

    return {"status": "plan_presented", "plan_version_id": v_id}


# ---------------------------------------------------------------------------
#  Admin: API Key Management
# ---------------------------------------------------------------------------

class CreateApiKeyRequest(BaseModel):
    owner: str = "default"
    scope: str = "api"


@router.post("/admin/api-keys")
async def create_api_key(
    payload: CreateApiKeyRequest,
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> dict[str, str]:
    """Generate a new API key. Returns the raw key (only shown once)."""
    raw_key = f"aip_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:12] + "..."

    try:
        from psycopg.types.json import Json
        import psycopg
        from psycopg.rows import dict_row
        from app.core.config import get_settings
        settings = get_settings()
        with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO api_key (key_hash, key_prefix, owner, scope) "
                    "VALUES (%s, %s, %s, %s) RETURNING id",
                    (key_hash, key_prefix, payload.owner, payload.scope),
                )
                row = cur.fetchone()
            conn.commit()
        return {
            "api_key": raw_key,
            "key_id": str(row["id"]) if row else "",
            "prefix": key_prefix,
            "owner": payload.owner,
            "scope": payload.scope,
            "warning": "Save this key now. It cannot be retrieved again.",
        }
    except Exception as exc:
        logger.warning("create_api_key_error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create API key. Ensure migration 006 has been applied.")


@router.get("/admin/api-keys")
async def list_api_keys(
    service: StudyRuntimeService = Depends(get_study_runtime_service),
) -> list[dict[str, Any]]:
    """List all API keys (without the raw key)."""
    try:
        import psycopg
        from psycopg.rows import dict_row
        from app.core.config import get_settings
        settings = get_settings()
        with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, key_prefix, owner, scope, is_active, created_at, last_used_at "
                    "FROM api_key ORDER BY created_at DESC"
                )
                rows = cur.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []  # api_key table may not exist


# ---------------------------------------------------------------------------
#  Auth: User Registration & Login
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    display_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=6, max_length=200)
    team_name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/auth/register")
async def register_user(payload: RegisterRequest) -> dict[str, Any]:
    """Register a new user and optionally create a team."""
    password_hash = hashlib.pbkdf2_hmac("sha256", payload.password.encode(), b"aipersona-salt-v1", 100_000).hex()
    # TODO: Token is not persisted — this is a demo placeholder.
    # For production, store in DB with expiry and validate in auth middleware.
    token = secrets.token_urlsafe(32)

    try:
        import psycopg
        from psycopg.rows import dict_row
        from app.core.config import get_settings
        settings = get_settings()
        with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM app_user WHERE email=%s", (payload.email,))
                if cur.fetchone():
                    raise HTTPException(status_code=409, detail="该邮箱已注册")
                cur.execute(
                    "INSERT INTO app_user (email, display_name, password_hash) "
                    "VALUES (%s, %s, %s) RETURNING id, email, display_name, role",
                    (payload.email, payload.display_name, password_hash),
                )
                user = dict(cur.fetchone())
                team = None
                if payload.team_name:
                    slug = payload.team_name.lower().replace(" ", "-")[:50]
                    cur.execute(
                        "INSERT INTO team (name, slug, owner_id) VALUES (%s, %s, %s) RETURNING id, name, slug",
                        (payload.team_name, slug, user["id"]),
                    )
                    team = dict(cur.fetchone())
                    cur.execute(
                        "INSERT INTO team_member (team_id, user_id, role) VALUES (%s, %s, 'owner')",
                        (team["id"], user["id"]),
                    )
            conn.commit()
        return {
            "user": {k: str(v) for k, v in user.items()},
            "team": {k: str(v) for k, v in team.items()} if team else None,
            "token": token,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("register_error: %s", exc)
        raise HTTPException(status_code=500, detail="注册失败，请确保已运行 migration 007")


@router.post("/auth/login")
async def login_user(payload: LoginRequest) -> dict[str, Any]:
    """Login with email and password."""
    password_hash = hashlib.pbkdf2_hmac("sha256", payload.password.encode(), b"aipersona-salt-v1", 100_000).hex()
    try:
        import psycopg
        from psycopg.rows import dict_row
        from app.core.config import get_settings
        settings = get_settings()
        with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, email, display_name, role FROM app_user "
                    "WHERE email=%s AND password_hash=%s AND is_active=true",
                    (payload.email, password_hash),
                )
                user = cur.fetchone()
                if not user:
                    raise HTTPException(status_code=401, detail="邮箱或密码错误")
                cur.execute(
                    "SELECT t.id, t.name, t.slug, tm.role AS member_role "
                    "FROM team_member tm JOIN team t ON t.id=tm.team_id WHERE tm.user_id=%s",
                    (user["id"],),
                )
                teams = [dict(row) for row in cur.fetchall()]
        token = secrets.token_urlsafe(32)
        return {
            "user": {k: str(v) for k, v in dict(user).items()},
            "teams": [{k: str(v) for k, v in t.items()} for t in teams],
            "token": token,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("login_error: %s", exc)
        raise HTTPException(status_code=500, detail="登录失败")


@router.post("/teams/{team_id}/invite")
async def invite_team_member(team_id: str, request: Request, payload: RegisterRequest) -> dict[str, Any]:
    """Invite a user to a team (creates account if needed). Requires caller to be a team member."""
    # Verify caller is a member of this team
    caller_id = request.headers.get("X-User-Id", "")
    if not caller_id:
        raise HTTPException(status_code=401, detail="需要登录后才能邀请成员（缺少 X-User-Id）")

    password_hash = hashlib.pbkdf2_hmac("sha256", payload.password.encode(), b"aipersona-salt-v1", 100_000).hex()
    try:
        import psycopg
        from psycopg.rows import dict_row
        from app.core.config import get_settings
        settings = get_settings()
        with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Check caller is a team member with admin/owner role
                cur.execute(
                    "SELECT role FROM team_member WHERE team_id=%s AND user_id=%s",
                    (team_id, caller_id),
                )
                member = cur.fetchone()
                if not member or member["role"] not in ("owner", "admin"):
                    raise HTTPException(status_code=403, detail="只有团队管理员可以邀请成员")

                cur.execute("SELECT id FROM app_user WHERE email=%s", (payload.email,))
                row = cur.fetchone()
                if row:
                    user_id = row["id"]
                else:
                    cur.execute(
                        "INSERT INTO app_user (email, display_name, password_hash) "
                        "VALUES (%s, %s, %s) RETURNING id",
                        (payload.email, payload.display_name, password_hash),
                    )
                    user_id = cur.fetchone()["id"]
                cur.execute(
                    "INSERT INTO team_member (team_id, user_id, role) VALUES (%s, %s, 'member') "
                    "ON CONFLICT (team_id, user_id) DO NOTHING",
                    (team_id, user_id),
                )
            conn.commit()
        return {"status": "invited", "user_id": str(user_id)}
    except Exception as exc:
        logger.warning("invite_error: %s", exc)
        raise HTTPException(status_code=500, detail="邀请失败")
