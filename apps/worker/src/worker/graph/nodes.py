"""Graph nodes — each function takes ResearchState and returns a partial state update.

All heavy LLM/DB logic is delegated to existing functions in
worker.activities.study_runtime (prefixed with _) and worker.llm.
"""

from __future__ import annotations

import json
import logging
import math
from itertools import product as cartesian_product
from typing import Any

from langgraph.types import interrupt

from worker.activities.study_runtime import (
    _build_management_summary,
    _build_replay_manifest,
    _build_report_html,
    _connect,
    _extract_qual_themes,
    _generate_recommendation,
    _get_study_context,
    _load_selected_stimuli,
    _load_selected_twin_personas,
    _merge_usage,
    _run_idi_interview,
    _run_replica_scoring,
    _write_artifact,
    _write_formatted_artifact,
)
from worker.graph.state import ResearchState
from worker.llm import chat_json_with_metadata

logger = logging.getLogger(__name__)


def _action(label: str, value: str) -> dict[str, str]:
    return {"label": label, "value": value}


# ---------------------------------------------------------------------------
#  Message helper (writes to study_message table for frontend polling)
# ---------------------------------------------------------------------------

def _post_message(
    study_id: str,
    role: str,
    content: str,
    *,
    message_type: str = "text",
    metadata: dict[str, Any] | None = None,
) -> None:
    from psycopg.types.json import Json
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO study_message (study_id, role, content, message_type, metadata_json) "
                "VALUES (%s, %s, %s, %s, %s)",
                (study_id, role, content, message_type, Json(metadata or {})),
            )
        conn.commit()


# ---------------------------------------------------------------------------
#  Node: plan_research
# ---------------------------------------------------------------------------

def plan_research(state: ResearchState) -> dict[str, Any]:
    """Load study context, twins, stimuli. Set up interview queue."""
    run_id = state["run_id"]
    study_id = state["study_id"]

    context = _get_study_context(run_id)
    twins = _load_selected_twin_personas(context)
    stimuli = _load_selected_stimuli(context)
    bq = context["business_question"]

    # Build interview pair queue: all combinations (list-of-lists for JSON serialization)
    pairs = [[ti, si] for ti, si in cartesian_product(range(len(twins)), range(len(stimuli)))]
    total_idi = len(pairs)
    est_minutes = max(1, math.ceil(total_idi * 5 * 12 / 60))

    # Mark run as running
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE study_run SET status='running', started_at=COALESCE(started_at, now()), updated_at=now() WHERE id=%s",
                (run_id,),
            )
            cur.execute(
                "UPDATE run_step SET status='running', started_at=COALESCE(started_at, now()), updated_at=now() "
                "WHERE study_run_id=%s AND step_type='twin_preparation' AND attempt_no=1",
                (run_id,),
            )
        conn.commit()

    _post_message(
        study_id, "agent",
        f"收到确认，正在启动 AI 定性访谈...\n\n"
        f"共 {total_idi} 场访谈（{len(twins)} 个人群 × {len(stimuli)} 个刺激物），预计约 {est_minutes} 分钟。",
    )

    return {
        "business_question": bq,
        "twins": twins,
        "stimuli": stimuli,
        "interview_pairs": pairs,
        "interview_index": 0,
        "interviews": [],
        "phase": "qual",
        "total_usage": {},
    }


# ---------------------------------------------------------------------------
#  Node: run_single_interview
# ---------------------------------------------------------------------------

def run_single_interview(state: ResearchState) -> dict[str, Any]:
    """Execute one IDI interview for the current pair index."""
    idx = state.get("interview_index", 0)
    pairs = state.get("interview_pairs", [])
    twins = state.get("twins", [])
    stimuli = state.get("stimuli", [])
    study_id = state["study_id"]
    bq = state["business_question"]

    if idx >= len(pairs):
        return {"phase": "themes"}

    ti, si = pairs[idx]
    twin = twins[ti]
    stimulus = stimuli[si]

    _post_message(
        study_id, "agent",
        f"正在访谈：**{twin['name']}** × **{stimulus['name']}**",
        message_type="progress",
        metadata={"phase": "qual", "current": idx + 1, "total": len(pairs)},
    )

    interview = _run_idi_interview(twin, stimulus, bq)

    excerpt = interview["response"][:300].rstrip()
    if len(interview["response"]) > 300:
        excerpt += "..."
    _post_message(
        study_id, "agent",
        f"**{twin['name']}** 对 **{stimulus['name']}** 的看法：\n\n> {excerpt}",
    )

    return {
        "interviews": [interview],
        "interview_index": idx + 1,
    }


# ---------------------------------------------------------------------------
#  Node: evaluate_interview_progress (LLM decision)
# ---------------------------------------------------------------------------

def evaluate_interview_progress(state: ResearchState) -> dict[str, Any]:
    """LLM evaluates whether interviews are sufficient or need adjustment."""
    interviews = state.get("interviews", [])
    pairs = state.get("interview_pairs", [])
    idx = state.get("interview_index", 0)
    bq = state["business_question"]
    study_id = state["study_id"]

    # If we haven't done all planned pairs, check after every 3 interviews
    if idx < len(pairs) and idx % 3 != 0:
        return {"should_continue_interviews": True}

    # If all pairs are done, move to themes
    if idx >= len(pairs):
        _post_message(study_id, "agent", "所有计划访谈已完成，正在评估数据充分性...", message_type="progress")
        return {"should_continue_interviews": False}

    # LLM evaluation: are the interviews so far sufficient?
    summaries = "\n".join(
        f"- {iv['twin_name']} × {iv['stimulus_name']}: {iv['response'][:150]}"
        for iv in interviews[-6:]
    )

    try:
        result = chat_json_with_metadata(
            system_prompt=(
                "你是消费者研究质量评估专家。评估当前访谈数据是否足够进入主题提取阶段。\n"
                "返回 JSON：{\"sufficient\": true/false, \"reason\": \"简要说明\", \"pivot\": false, \"pivot_reason\": \"\"}\n"
                "sufficient=true 表示数据覆盖了关键维度。\n"
                "pivot=true 表示发现了意外方向值得用户确认。"
            ),
            user_prompt=f"研究问题：{bq}\n已完成 {len(interviews)}/{len(pairs)} 场。\n最近访谈摘要：\n{summaries}",
        )
        parsed = json.loads(result["content"])
        sufficient = bool(parsed.get("sufficient", idx >= len(pairs)))
        pivot = bool(parsed.get("pivot", False))
        pivot_reason = str(parsed.get("pivot_reason", ""))
        reason = str(parsed.get("reason", ""))

        if pivot and pivot_reason:
            _post_message(
                study_id, "agent",
                f"**研究发现**：{reason}\n\n{pivot_reason}",
                message_type="text",
            )
            return {
                "should_continue_interviews": False,
                "pivot_reason": pivot_reason,
                "phase": "pivot_review",
            }

        if not sufficient:
            _post_message(study_id, "agent", f"进度评估：{reason}，继续访谈。", message_type="progress")

        return {"should_continue_interviews": not sufficient}

    except Exception as exc:
        logger.warning("evaluate_progress_error: %s", exc)
        return {"should_continue_interviews": idx < len(pairs)}


# ---------------------------------------------------------------------------
#  Node: extract_themes
# ---------------------------------------------------------------------------

def extract_themes(state: ResearchState) -> dict[str, Any]:
    """Extract qualitative themes from all interviews."""
    interviews = state.get("interviews", [])
    bq = state["business_question"]
    study_id = state["study_id"]
    run_id = state["run_id"]

    _post_message(study_id, "agent", "所有访谈完成，正在提取定性主题...", message_type="progress")

    themes, theme_usage = _extract_qual_themes(interviews, bq)
    qual_usage = _merge_usage(*(iv.get("usage", {}) for iv in interviews), theme_usage)

    # Write qual artifact
    with _connect() as conn:
        _write_artifact(
            run_id, "qual_transcript",
            {"interviews": interviews, "themes": themes,
             "twin_count": len(state.get("twins", [])),
             "stimulus_count": len(state.get("stimuli", [])),
             "usage": qual_usage},
            connection=conn,
        )
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE run_step SET status='succeeded', ended_at=now(), updated_at=now() "
                "WHERE study_run_id=%s AND step_type='twin_preparation' AND attempt_no=1",
                (run_id,),
            )
            cur.execute(
                "INSERT INTO run_step (study_run_id, step_type, status, attempt_no, started_at, ended_at) "
                "VALUES (%s, 'qual_execution', 'succeeded', 1, now(), now()) "
                "ON CONFLICT (study_run_id, step_type, attempt_no) DO NOTHING",
                (run_id,),
            )
        conn.commit()

    theme_labels = themes.get("themes", [])
    overall_insight = themes.get("overall_insight", "")
    _post_message(
        study_id, "agent",
        f"定性阶段完成。\n\n**{len(theme_labels)} 个核心主题**：{', '.join(str(t) for t in theme_labels[:5])}\n\n{overall_insight}",
        message_type="card",
        metadata={"card_type": "qual_summary", "data": themes},
    )

    return {"qual_themes": themes, "total_usage": qual_usage, "phase": "review"}


# ---------------------------------------------------------------------------
#  Node: request_human_review (triggers interrupt)
# ---------------------------------------------------------------------------

def request_human_review(state: ResearchState) -> dict[str, Any]:
    """Pause execution and ask the user for a decision."""
    study_id = state["study_id"]
    run_id = state["run_id"]
    phase = state.get("phase", "review")

    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO run_step (study_run_id, step_type, status, attempt_no) "
                "VALUES (%s, 'quant_execution', 'blocked', 1) "
                "ON CONFLICT (study_run_id, step_type, attempt_no) DO NOTHING",
                (run_id,),
            )
            cur.execute(
                "INSERT INTO approval_gate (scope_type, scope_ref_id, approval_type, status) "
                "VALUES ('study_run', %s, 'midrun', 'requested')",
                (run_id,),
            )
            cur.execute(
                "UPDATE study_run SET status='awaiting_midrun_approval', updated_at=now() WHERE id=%s",
                (run_id,),
            )
        conn.commit()

    if phase == "pivot_review":
        pivot_reason = state.get("pivot_reason", "")
        _post_message(
            study_id, "agent",
            f"在访谈中发现了新方向：\n\n{pivot_reason}\n\n"
            "是否调整研究方向继续探索？",
            message_type="action_request",
            metadata={
                "actions": [
                    _action("继续当前方向", "continue"),
                    _action("调整方向探索", "adjust_direction"),
                    _action("暂停调整", "pause_adjustment"),
                ],
                "action_id": "midrun_review",
            },
        )
    else:
        twins = state.get("twins", [])
        stimuli = state.get("stimuli", [])
        _post_message(
            study_id, "agent",
            f"定性探索已完成，{len(twins)} 个目标人群 × {len(stimuli)} 个刺激物的访谈都已收录。\n\n"
            "是否继续进入 AI 综合评估阶段？",
            message_type="action_request",
            metadata={
                "actions": [
                    _action("继续评估", "continue"),
                    _action("调整方向探索", "adjust_direction"),
                    _action("暂停调整", "pause_adjustment"),
                ],
                "action_id": "midrun_review",
            },
        )

    # LangGraph interrupt — execution pauses here until resume
    human_input = interrupt("awaiting_human_review")

    return {
        "human_feedback": str(human_input.get("decision_comment", "")),
        "human_action": str(human_input.get("action", "continue")),
        "phase": "quant",
    }


# ---------------------------------------------------------------------------
#  Node: run_scoring
# ---------------------------------------------------------------------------

def run_scoring(state: ResearchState) -> dict[str, Any]:
    """Run replica scoring on interview data."""
    interviews = state.get("interviews", [])
    bq = state["business_question"]
    study_id = state["study_id"]
    run_id = state["run_id"]

    # Approve midrun gate
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE approval_gate SET status='approved', approved_by=%s, decision_comment=%s, updated_at=now() "
                "WHERE scope_type='study_run' AND scope_ref_id=%s AND approval_type='midrun' AND status='requested'",
                (state.get("human_feedback", "user"), state.get("human_feedback"), run_id),
            )
            cur.execute(
                "UPDATE run_step SET status='running', started_at=COALESCE(started_at, now()), updated_at=now() "
                "WHERE study_run_id=%s AND step_type='quant_execution' AND attempt_no=1",
                (run_id,),
            )
        conn.commit()

    _post_message(study_id, "agent", "收到确认，正在启动 AI 综合评估...")

    replicas = 3  # Could be dynamic based on state
    for round_no in range(replicas):
        _post_message(
            study_id, "agent",
            f"评分轮次 {round_no + 1}/{replicas}",
            message_type="progress",
            metadata={"phase": "quant", "current": round_no + 1, "total": replicas},
        )

    quant_result, quant_usage = _run_replica_scoring(interviews, bq, replicas=replicas)
    quant_result["usage"] = quant_usage

    _post_message(study_id, "agent", "AI 综合评估完成，正在评估置信度...")

    return {"quant_result": quant_result, "phase": "confidence_check"}


# ---------------------------------------------------------------------------
#  Node: evaluate_confidence (LLM decision)
# ---------------------------------------------------------------------------

def evaluate_confidence(state: ResearchState) -> dict[str, Any]:
    """LLM evaluates whether scoring confidence is sufficient."""
    quant_result = state.get("quant_result", {})
    ranking = quant_result.get("ranking", [])

    # Simple heuristic: if any concept has std > 15, confidence is low
    high_variance = [r for r in ranking if float(r.get("std", 0)) > 15]

    if high_variance:
        names = ", ".join(r["stimulus_name"] for r in high_variance)
        _post_message(
            state["study_id"], "agent",
            f"注意：{names} 的评分波动较大（标准差 > 15），结果不够稳定。",
            message_type="text",
        )
        return {"confidence_sufficient": False}

    return {"confidence_sufficient": True}


# ---------------------------------------------------------------------------
#  Node: generate_recommendation_node
# ---------------------------------------------------------------------------

def generate_recommendation_node(state: ResearchState) -> dict[str, Any]:
    """Generate final recommendation."""
    qual_themes = state.get("qual_themes", {})
    quant_result = state.get("quant_result", {})
    bq = state["business_question"]
    study_id = state["study_id"]

    _post_message(study_id, "agent", "正在生成推荐结论...")

    recommendation, rec_usage = _generate_recommendation(qual_themes, quant_result, bq)
    recommendation["usage"] = rec_usage

    winner = recommendation.get("winner", "待确认")
    confidence = recommendation.get("confidence_label", "-- / 中")
    supporting = recommendation.get("supporting_text", "")
    ranking = quant_result.get("ranking", [])
    ranking_text = "\n".join(
        f"  {i+1}. **{r.get('stimulus_name', '')}** — {r.get('score', 0)} 分 ({r.get('confidence_label', '')})"
        for i, r in enumerate(ranking)
    )

    _post_message(
        study_id, "agent",
        f"## 推荐结论\n\n**{winner}** 是当前最值得推进的方案。\n\n"
        f"{supporting}\n\n**置信度**：{confidence}\n\n**排名**：\n{ranking_text}",
        message_type="card",
        metadata={"card_type": "recommendation", "data": recommendation},
    )

    return {"recommendation": recommendation}


# ---------------------------------------------------------------------------
#  Node: extract_memories_node
# ---------------------------------------------------------------------------

def extract_memories_node(state: ResearchState) -> dict[str, Any]:
    """Extract and store research memories for future studies."""
    qual_themes = state.get("qual_themes", {})
    recommendation = state.get("recommendation", {})
    quant_result = state.get("quant_result", {})
    bq = state["business_question"]
    study_id = state["study_id"]

    memories: list[dict[str, Any]] = []

    for theme in qual_themes.get("themes", [])[:5]:
        theme_str = str(theme)
        memories.append({"memory_type": "theme", "key": theme_str,
                         "value": f"研究「{bq[:60]}」核心主题：{theme_str}", "confidence": 0.85})

    overall = qual_themes.get("overall_insight", "")
    if overall:
        memories.append({"memory_type": "insight", "key": "overall_insight",
                         "value": overall, "confidence": 0.80})

    for r in quant_result.get("ranking", [])[:3]:
        memories.append({"memory_type": "segment_finding", "key": f"ranking_{r.get('stimulus_name', '')}",
                         "value": f"{r.get('stimulus_name', '')} 得分 {r.get('score', 0)}（{r.get('confidence_label', '')}）",
                         "confidence": 0.90})

    winner = recommendation.get("winner", "")
    if winner:
        memories.append({"memory_type": "brand_positioning", "key": f"winner_{winner}",
                         "value": f"推荐方案：{winner}。{recommendation.get('supporting_text', '')[:200]}",
                         "confidence": 0.90})

    if memories:
        with _connect() as conn:
            with conn.cursor() as cur:
                for m in memories:
                    cur.execute(
                        "INSERT INTO study_memory (study_id, memory_type, key, value, confidence) "
                        "VALUES (%s, %s, %s, %s, %s)",
                        (study_id, m["memory_type"], m["key"], m["value"], m["confidence"]),
                    )
            conn.commit()

        _post_message(
            study_id, "agent",
            f"已自动提取 **{len(memories)}** 条研究记忆，将在下次研究中自动引用。",
            message_type="progress",
            metadata={"phase": "memory_extraction", "count": len(memories)},
        )

    return {"memories": memories}


# ---------------------------------------------------------------------------
#  Node: complete_study
# ---------------------------------------------------------------------------

def complete_study(state: ResearchState) -> dict[str, Any]:
    """Write final artifacts and mark study as completed."""
    run_id = state["run_id"]
    study_id = state["study_id"]
    qual_themes = state.get("qual_themes", {})
    quant_result = state.get("quant_result", {})
    recommendation = state.get("recommendation", {})
    bq = state["business_question"]

    context = _get_study_context(run_id)
    replay_manifest = _build_replay_manifest(
        context=context, qual_themes=qual_themes,
        quant_ranking=quant_result, recommendation=recommendation,
    )
    management_summary = _build_management_summary(
        context=context, qual_themes=qual_themes,
        quant_ranking=quant_result, recommendation=recommendation,
    )
    report_html = _build_report_html(
        context=context, management_summary=management_summary,
        quant_ranking=quant_result,
    )

    with _connect() as conn:
        _write_artifact(run_id, "quant_ranking", quant_result, connection=conn)
        _write_artifact(run_id, "recommendation", recommendation, connection=conn)
        _write_artifact(run_id, "replay", replay_manifest, connection=conn)
        _write_artifact(run_id, "summary", management_summary, connection=conn)
        _write_formatted_artifact(
            run_id, "report",
            {"title": f"{bq} 管理层简报", "html": report_html, "summary": management_summary},
            artifact_format="html", storage_uri="inline://html", connection=conn,
        )
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE run_step SET status='succeeded', ended_at=now(), updated_at=now() "
                "WHERE study_run_id=%s AND step_type='quant_execution' AND attempt_no=1",
                (run_id,),
            )
            cur.execute(
                "INSERT INTO run_step (study_run_id, step_type, status, attempt_no, started_at, ended_at) "
                "VALUES (%s, 'synthesis', 'succeeded', 1, now(), now()) "
                "ON CONFLICT (study_run_id, step_type, attempt_no) DO NOTHING",
                (run_id,),
            )
            cur.execute(
                "UPDATE study_run SET status='succeeded', ended_at=now(), updated_at=now() WHERE id=%s RETURNING study_id",
                (run_id,),
            )
            row = cur.fetchone()
            if row:
                cur.execute("UPDATE study SET status='completed', updated_at=now() WHERE id=%s", (row["study_id"],))
        conn.commit()

    _post_message(
        study_id, "agent",
        "研究已完成。你可以继续追问研究细节，或者：",
        message_type="action_request",
        metadata={
            "actions": [
                _action("下载报告", "open_report"),
                _action("查看详细对比", "open_compare"),
                _action("查看研究回放", "open_replay"),
            ],
            "action_id": "post_study",
        },
    )

    return {"phase": "complete"}
