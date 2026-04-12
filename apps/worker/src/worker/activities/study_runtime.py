from __future__ import annotations

import asyncio
import html
import json
import logging
from contextlib import contextmanager
import os
from typing import Any, Iterator, Optional

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json
from worker.llm import LLMRequestError, chat_json_with_metadata, chat_with_metadata

logger = logging.getLogger(__name__)


def _database_url() -> str:
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL is required for worker activities")
    return database_url


@contextmanager
def _connect() -> Iterator[psycopg.Connection[Any]]:
    with psycopg.connect(_database_url(), row_factory=dict_row) as connection:
        yield connection


def _get_study_context(run_id: str) -> dict[str, Any]:
    """Fetch study context needed for AI execution."""
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT s.business_question, s.study_type, s.category, s.brand,
                       spv.twin_version_ids, spv.stimulus_ids,
                       spv.qual_config_json, spv.quant_config_json
                FROM study_run sr
                JOIN study s ON s.id = sr.study_id
                JOIN study_plan_version spv ON spv.id = sr.study_plan_version_id
                WHERE sr.id = %s
                """,
                (run_id,),
            )
            row = cur.fetchone()
    if row is None:
        raise RuntimeError(f"Study run {run_id} not found")
    return dict(row)


def _write_artifact(
    run_id: str,
    artifact_type: str,
    manifest: dict[str, Any],
    *,
    connection: Optional[psycopg.Connection[Any]] = None,
) -> str:
    """Write an artifact to the database and return its ID."""
    owns_connection = connection is None
    conn = connection
    if conn is None:
        conn = psycopg.connect(_database_url(), row_factory=dict_row)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO artifact (study_run_id, artifact_type, format, storage_uri, artifact_manifest_json, status)
                VALUES (%s, %s, 'json', 'inline://json', %s, 'ready')
                RETURNING id
                """,
                (run_id, artifact_type, Json(manifest)),
            )
            row = cur.fetchone()
        if owns_connection:
            conn.commit()
    finally:
        if owns_connection:
            conn.close()
    return str(row["id"])


def _write_formatted_artifact(
    run_id: str,
    artifact_type: str,
    manifest: dict[str, Any],
    *,
    artifact_format: str,
    storage_uri: str,
    connection: Optional[psycopg.Connection[Any]] = None,
) -> str:
    owns_connection = connection is None
    conn = connection
    if conn is None:
        conn = psycopg.connect(_database_url(), row_factory=dict_row)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO artifact (study_run_id, artifact_type, format, storage_uri, artifact_manifest_json, status)
                VALUES (%s, %s, %s, %s, %s, 'ready')
                RETURNING id
                """,
                (run_id, artifact_type, artifact_format, storage_uri, Json(manifest)),
            )
            row = cur.fetchone()
        if owns_connection:
            conn.commit()
    finally:
        if owns_connection:
            conn.close()
    return str(row["id"])


def _coerce_identifier_list(raw_values: Any) -> list[str]:
    if not isinstance(raw_values, list):
        return []
    return [str(item) for item in raw_values]


def _load_selected_twin_personas(context: dict[str, Any]) -> list[dict[str, Any]]:
    twin_version_ids = _coerce_identifier_list(context.get("twin_version_ids"))
    if not twin_version_ids:
        raise RuntimeError("Study plan version has no twin_version_ids")

    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                  tv.id,
                  tv.persona_profile_snapshot_json,
                  ta.label AS target_audience_label
                FROM twin_version tv
                JOIN consumer_twin ct ON ct.id = tv.consumer_twin_id
                LEFT JOIN target_audience ta ON ta.id = ct.target_audience_id
                WHERE tv.id = ANY(%s::uuid[])
                ORDER BY array_position(%s::uuid[], tv.id)
                """,
                (twin_version_ids, twin_version_ids),
            )
            rows = cur.fetchall()

    personas: list[dict[str, Any]] = []
    for row in rows:
        snapshot = row.get("persona_profile_snapshot_json")
        snapshot = snapshot if isinstance(snapshot, dict) else {}
        system_prompt = str(snapshot.get("system_prompt", "")).strip()
        if not system_prompt:
            raise RuntimeError(f"Twin version {row['id']} is missing system_prompt in snapshot")
        personas.append(
            {
                "id": str(row["id"]),
                "name": str(snapshot.get("name") or row.get("target_audience_label") or row["id"]),
                "system_prompt": system_prompt,
                "target_audience_label": row.get("target_audience_label"),
                "snapshot": snapshot,
            }
        )

    missing = sorted(set(twin_version_ids) - {item["id"] for item in personas})
    if missing:
        raise RuntimeError(f"Twin versions not found in asset catalog: {', '.join(missing)}")
    return personas


def _compose_stimulus_description(record: dict[str, Any]) -> str:
    payload = record.get("stimulus_json")
    payload = payload if isinstance(payload, dict) else {}
    lines = [f"产品概念：{record.get('name', '未命名刺激物')}"]
    description = str(record.get("description", "")).strip()
    if description:
        lines.append(f"核心描述：{description}")
    if payload.get("price"):
        lines.append(f"价格定位：{payload['price']}")
    if payload.get("packaging"):
        lines.append(f"包装：{payload['packaging']}")
    if payload.get("target_scene"):
        lines.append(f"目标场景：{payload['target_scene']}")
    return "\n".join(lines)


def _load_selected_stimuli(context: dict[str, Any]) -> list[dict[str, Any]]:
    stimulus_ids = _coerce_identifier_list(context.get("stimulus_ids"))
    if not stimulus_ids:
        raise RuntimeError("Study plan version has no stimulus_ids")

    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, description, stimulus_json
                FROM stimulus
                WHERE id = ANY(%s::uuid[])
                ORDER BY array_position(%s::uuid[], id)
                """,
                (stimulus_ids, stimulus_ids),
            )
            rows = cur.fetchall()

    stimuli = [
        {
            "id": str(row["id"]),
            "name": str(row["name"]),
            "description": _compose_stimulus_description(dict(row)),
            "raw": dict(row),
        }
        for row in rows
    ]
    missing = sorted(set(stimulus_ids) - {item["id"] for item in stimuli})
    if missing:
        raise RuntimeError(f"Stimuli not found in asset catalog: {', '.join(missing)}")
    return stimuli


def _merge_usage(*usage_items: dict[str, Any]) -> dict[str, Any]:
    non_empty = [item for item in usage_items if isinstance(item, dict)]
    if not non_empty:
        return {}
    model = str(non_empty[-1].get("model") or "unknown")
    return {
        "model": model,
        "prompt_tokens": sum(int(item.get("prompt_tokens", 0) or 0) for item in non_empty),
        "completion_tokens": sum(int(item.get("completion_tokens", 0) or 0) for item in non_empty),
        "total_tokens": sum(int(item.get("total_tokens", 0) or 0) for item in non_empty),
        "cost_estimate": round(sum(float(item.get("cost_estimate", 0) or 0) for item in non_empty), 4),
        "call_count": len(non_empty),
    }


def _build_replay_manifest(
    *,
    context: dict[str, Any],
    qual_themes: dict[str, Any],
    quant_ranking: dict[str, Any],
    recommendation: dict[str, Any],
) -> dict[str, Any]:
    ranking = quant_ranking.get("ranking") if isinstance(quant_ranking, dict) else []
    ranking = ranking if isinstance(ranking, list) else []
    winner = recommendation.get("winner") if isinstance(recommendation, dict) else None
    next_action = recommendation.get("next_action") if isinstance(recommendation, dict) else None
    stages = [
        {
            "id": "plan",
            "label": "计划锁定",
            "inputs": [context.get("business_question", "未命名研究问题")],
            "outputs": [
                f"{len(_coerce_identifier_list(context.get('twin_version_ids')))} 个孪生版本",
                f"{len(_coerce_identifier_list(context.get('stimulus_ids')))} 个刺激物",
            ],
            "decisions": ["进入 AI 定性访谈"],
        },
        {
            "id": "qual",
            "label": "定性访谈",
            "inputs": [context.get("business_question", "未命名研究问题")],
            "outputs": list(qual_themes.get("themes", []))[:4] if isinstance(qual_themes, dict) else [],
            "decisions": [str(qual_themes.get("overall_insight", ""))] if isinstance(qual_themes, dict) else [],
        },
        {
            "id": "quant",
            "label": "量化排序",
            "inputs": [str(item.get("stimulus_name", "")) for item in ranking[:3]],
            "outputs": [
                f"{item.get('stimulus_name', '未命名')} {item.get('score', '--')}"
                for item in ranking[:3]
            ],
            "decisions": [str(quant_ranking.get("scoring_methodology", ""))] if isinstance(quant_ranking, dict) else [],
        },
        {
            "id": "recommendation",
            "label": "推荐结论",
            "inputs": [winner or "待确定"],
            "outputs": [str(recommendation.get("supporting_text", ""))] if isinstance(recommendation, dict) else [],
            "decisions": [str(next_action or "需人工复核")],
        },
    ]
    return {
        "title": f"{context.get('study_type', 'study')} runtime replay",
        "stages": stages,
    }


def _build_management_summary(
    *,
    context: dict[str, Any],
    qual_themes: dict[str, Any],
    quant_ranking: dict[str, Any],
    recommendation: dict[str, Any],
) -> dict[str, Any]:
    ranking = quant_ranking.get("ranking") if isinstance(quant_ranking, dict) else []
    ranking = ranking if isinstance(ranking, list) else []
    top_two = ranking[:2]
    headline = f"{recommendation.get('winner', '当前无明确优胜概念')} 建议进入下一轮验证"
    evidence = [str(qual_themes.get("overall_insight", ""))] if isinstance(qual_themes, dict) else []
    evidence.extend(
        f"{item.get('stimulus_name', '未命名')} 得分 {item.get('score', '--')}，置信度 {item.get('confidence_label', '--')}"
        for item in top_two
    )
    return {
        "headline": headline,
        "business_question": context.get("business_question"),
        "winner": recommendation.get("winner"),
        "supporting_text": recommendation.get("supporting_text"),
        "next_action": recommendation.get("next_action"),
        "evidence_points": [point for point in evidence if point],
        "segment_differences": recommendation.get("segment_differences", []),
    }


def _build_report_html(
    *,
    context: dict[str, Any],
    management_summary: dict[str, Any],
    quant_ranking: dict[str, Any],
) -> str:
    ranking = quant_ranking.get("ranking") if isinstance(quant_ranking, dict) else []
    ranking = ranking if isinstance(ranking, list) else []
    ranking_items = "".join(
        (
            "<li>"
            f"{html.escape(str(item.get('stimulus_name', '未命名')))}"
            f" · 得分 {html.escape(str(item.get('score', '--')))}"
            f" · 置信度 {html.escape(str(item.get('confidence_label', '--')))}"
            "</li>"
        )
        for item in ranking
    )
    evidence_items = "".join(
        f"<li>{html.escape(str(item))}</li>"
        for item in management_summary.get("evidence_points", [])
    )
    # Cost summary
    cost_est = context.get("estimated_cost") or management_summary.get("estimated_cost")
    cost_actual = management_summary.get("actual_cost") or quant_ranking.get("usage", {}).get("cost_estimate")
    cost_html = ""
    if cost_est or cost_actual:
        cost_html = (
            "<div class='card' style='margin-top:24px'>"
            "<div class='label'>成本追踪</div>"
            "<div style='display:flex;gap:32px;margin-top:8px'>"
            f"<div><div class='label'>预算</div><div style='font-size:18px;font-weight:700;margin-top:4px'>¥{cost_est or '--'}</div></div>"
            f"<div><div class='label'>实际</div><div style='font-size:18px;font-weight:700;margin-top:4px;color:#6366f1'>¥{cost_actual or '--'}</div></div>"
            "</div></div>"
        )

    # Ranking table
    ranking_table = ""
    if ranking:
        rows = "".join(
            f"<tr>"
            f"<td style='padding:10px 14px;border-bottom:1px solid #1a1a2e'>{i+1}</td>"
            f"<td style='padding:10px 14px;border-bottom:1px solid #1a1a2e;font-weight:600'>{html.escape(str(item.get('stimulus_name','')))}</td>"
            f"<td style='padding:10px 14px;border-bottom:1px solid #1a1a2e;text-align:right;font-size:20px;font-weight:700'>{item.get('score','--')}</td>"
            f"<td style='padding:10px 14px;border-bottom:1px solid #1a1a2e;text-align:right;color:#6366f1'>{html.escape(str(item.get('confidence_label','')))}</td>"
            f"</tr>"
            for i, item in enumerate(ranking)
        )
        ranking_table = (
            "<table style='width:100%;border-collapse:collapse;margin-top:12px'>"
            "<thead><tr style='color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.04em'>"
            "<th style='padding:10px 14px;text-align:left'>#</th>"
            "<th style='padding:10px 14px;text-align:left'>概念</th>"
            "<th style='padding:10px 14px;text-align:right'>得分</th>"
            "<th style='padding:10px 14px;text-align:right'>置信度</th>"
            "</tr></thead>"
            f"<tbody>{rows}</tbody></table>"
        )

    style = (
        "<style>"
        "body{margin:0;padding:0;background:#030305;color:#e8e8ec;"
        "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Noto Sans SC',sans-serif;line-height:1.7;}"
        ".container{max-width:720px;margin:0 auto;padding:40px 28px;}"
        ".badge{display:inline-block;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);"
        "color:#6366f1;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:600;}"
        "h1{font-size:26px;font-weight:700;letter-spacing:-0.02em;margin:20px 0 12px;color:#f0f0f4;}"
        "h2{font-size:18px;color:#6366f1;margin-top:36px;font-weight:600;}"
        "h3{font-size:14px;color:#888;margin-top:24px;text-transform:uppercase;letter-spacing:0.04em;}"
        "p{margin:10px 0;color:#bbb;font-size:14px;}"
        ".card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);"
        "border-radius:12px;padding:20px;margin:16px 0;}"
        ".winner{font-size:32px;font-weight:700;color:#6366f1;margin:8px 0;}"
        ".label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.04em;}"
        "ul{padding-left:20px;}"
        "li{margin:8px 0;padding:10px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);"
        "border-radius:8px;list-style-position:inside;color:#ccc;font-size:13px;}"
        ".footer{margin-top:48px;padding-top:20px;border-top:1px solid rgba(255,255,255,.06);"
        "font-size:12px;color:#555;text-align:center;}"
        "</style>"
    )
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    winner = html.escape(str(management_summary.get("headline", "管理层摘要")))
    return (
        f"<!DOCTYPE html><html lang='zh-CN'><head><meta charset='utf-8'>"
        f"<meta name='viewport' content='width=device-width,initial-scale=1'>"
        f"<title>{html.escape(str(context.get('business_question', '研究报告')))} — AIpersona</title>{style}</head><body>"
        f"<div class='container'>"
        f"<span class='badge'>AIpersona 管理层简报</span>"
        f"<h1>{html.escape(str(context.get('business_question', 'AIpersona 研究报告')))}</h1>"
        f"<div class='card'><div class='label'>研究结论</div>"
        f"<div class='winner'>{winner}</div>"
        f"<p>{html.escape(str(management_summary.get('supporting_text', '')))}</p></div>"
        f"<h3>推荐下一步</h3><p style='font-size:15px;color:#e8e8ec;font-weight:500'>{html.escape(str(management_summary.get('next_action', '待确认')))}</p>"
        f"<h3>排序结果</h3>{ranking_table}"
        f"<h3>关键证据</h3><ul>{evidence_items}</ul>"
        f"{cost_html}"
        f"<div class='footer'>AI Consumer Research Report · 生成于 {timestamp} · AIpersona</div>"
        f"</div></body></html>"
    )


# ---------------------------------------------------------------------------
#  Activity 1: mark_run_running (unchanged — just marks status)
# ---------------------------------------------------------------------------

def _mark_run_running(payload: dict[str, str]) -> None:
    run_id = payload["study_run_id"]
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE study_run
                SET status = 'running',
                    started_at = COALESCE(started_at, now()),
                    updated_at = now()
                WHERE id = %s
                """,
                (run_id,),
            )
            cursor.execute(
                """
                UPDATE run_step
                SET status = 'running',
                    started_at = COALESCE(started_at, now()),
                    updated_at = now()
                WHERE study_run_id = %s
                  AND step_type = 'twin_preparation'
                  AND attempt_no = 1
                """,
                (run_id,),
            )
        connection.commit()


# ---------------------------------------------------------------------------
#  Activity 2: advance_to_midrun_review — NOW WITH AI QUAL RESEARCH
# ---------------------------------------------------------------------------

def _run_idi_interview(
    twin: dict[str, Any],
    stimulus: dict[str, Any],
    business_question: str,
) -> dict[str, Any]:
    """Run a multi-turn AI IDI interview: interviewer asks → twin answers → probe → answer → summary."""
    stimulus_desc = str(stimulus["description"])
    twin_system = str(twin["system_prompt"])
    interviewer_base = (
        "你是一位消费者研究访谈员，正在对被访者做一对一深度访谈。\n"
        f"研究问题：{business_question}\n"
        f"测试产品概念：\n{stimulus_desc}\n\n"
    )

    fallback = {
        "twin_id": twin["id"],
        "twin_name": twin["name"],
        "stimulus_id": stimulus["id"],
        "stimulus_name": stimulus["name"],
        "response": "（访谈未能完成）",
        "transcript": [],
        "usage": {},
    }

    try:
        # Round 1: interviewer opening questions
        r1_q = chat_with_metadata(
            system_prompt=interviewer_base + "请向被访者提出 2-3 个开放性问题，了解第一反应和购买意愿。",
            user_prompt="请提出你的开场问题。",
            temperature=0.6,
        )
        # Round 1: twin answers
        r1_a = chat_with_metadata(
            system_prompt=twin_system,
            user_prompt=(
                f"你正在参加一个产品调研。以下是产品概念：\n{stimulus_desc}\n\n"
                f"研究员的问题：\n{r1_q['content']}\n\n"
                "请用口语化的方式回答这些问题。"
            ),
            temperature=0.8,
        )
        # Round 2: interviewer probes deeper
        r2_q = chat_with_metadata(
            system_prompt=interviewer_base + f"被访者刚才的回答：\n{r1_a['content']}\n\n请追问 1-2 个更深入的问题。",
            user_prompt="基于被访者的回答，请追问更深入的问题。",
            temperature=0.6,
        )
        # Round 2: twin answers follow-up
        r2_a = chat_with_metadata(
            system_prompt=twin_system,
            user_prompt=(
                f"产品概念：\n{stimulus_desc}\n\n"
                f"你之前说了：\n{r1_a['content']}\n\n"
                f"研究员追问：\n{r2_q['content']}\n\n请继续回答。"
            ),
            temperature=0.8,
        )
        # Round 3: interviewer summary
        summary = chat_with_metadata(
            system_prompt=interviewer_base + "请用 3-5 句话总结本次访谈的关键发现和被访者态度。",
            user_prompt=(
                f"被访者第一轮回答：\n{r1_a['content']}\n\n"
                f"被访者追问回答：\n{r2_a['content']}\n\n"
                "请总结本次访谈。"
            ),
            temperature=0.5,
        )

        transcript = [
            {"role": "interviewer", "content": r1_q["content"]},
            {"role": "respondent", "content": r1_a["content"]},
            {"role": "interviewer", "content": r2_q["content"]},
            {"role": "respondent", "content": r2_a["content"]},
            {"role": "summary", "content": summary["content"]},
        ]
        all_usage = _merge_usage(r1_q["usage"], r1_a["usage"], r2_q["usage"], r2_a["usage"], summary["usage"])

        return {
            "twin_id": twin["id"],
            "twin_name": twin["name"],
            "stimulus_id": stimulus["id"],
            "stimulus_name": stimulus["name"],
            "response": summary["content"],
            "transcript": transcript,
            "usage": all_usage,
        }
    except Exception as exc:
        logger.warning("idi_interview_failed twin=%s stimulus=%s error=%s", twin["name"], stimulus["name"], exc)
        return {**fallback, "response": f"（访谈未能完成：{type(exc).__name__}）"}


def _extract_qual_themes(interviews: list[dict[str, Any]], business_question: str) -> tuple[dict[str, Any], dict[str, Any]]:
    """Use LLM to extract qualitative themes from interview transcripts."""
    interview_text = ""
    for i, interview in enumerate(interviews, 1):
        interview_text += f"\n--- 访谈 {i}: {interview['twin_name']} 评价 {interview['stimulus_name']} ---\n"
        interview_text += interview["response"]
        interview_text += "\n"

    try:
        llm_result = chat_json_with_metadata(
            system_prompt=(
                "你是一位消费者洞察分析师。请从以下访谈记录中提取关键的定性主题。\n"
                "返回 JSON 格式，包含以下字段：\n"
                '{\n'
                '  "themes": ["主题1", "主题2", ...],\n'
                '  "per_stimulus": [\n'
                '    {"stimulus_name": "xxx", "themes": ["主题"], "summary": "一句话摘要", "sentiment": "positive/mixed/negative"},\n'
                '    ...\n'
                '  ],\n'
                '  "overall_insight": "整体洞察一句话"\n'
                '}'
            ),
            user_prompt=(
                f"研究问题：{business_question}\n\n"
                f"访谈记录：\n{interview_text}"
            ),
        )
    except Exception as exc:
        logger.warning("qual_themes_llm_failed error=%s", exc)
        return {"themes": [], "per_stimulus": [], "overall_insight": "主题提取失败"}, {}

    try:
        return json.loads(str(llm_result["content"])), dict(llm_result["usage"])
    except json.JSONDecodeError:
        logger.warning("Failed to parse qual themes JSON, using raw text")
        raw = str(llm_result["content"])
        return {
            "themes": [],
            "per_stimulus": [],
            "overall_insight": raw,
            "raw": raw,
        }, dict(llm_result["usage"])


def _advance_to_midrun_review(payload: dict[str, str]) -> None:
    run_id = payload["study_run_id"]
    context = _get_study_context(run_id)
    selected_twins = _load_selected_twin_personas(context)
    selected_stimuli = _load_selected_stimuli(context)

    # --- AI Qualitative Research ---
    logger.info("qual_research_start run_id=%s", run_id)

    interviews: list[dict[str, Any]] = []
    for twin in selected_twins:
        for stimulus in selected_stimuli:
            logger.info("idi_interview twin=%s stimulus=%s", twin["name"], stimulus["name"])
            interview = _run_idi_interview(
                twin=twin,
                stimulus=stimulus,
                business_question=context["business_question"],
            )
            interviews.append(interview)

    # Extract themes
    themes, theme_usage = _extract_qual_themes(interviews, context["business_question"])
    qual_usage = _merge_usage(
        *(interview.get("usage", {}) for interview in interviews),
        theme_usage,
    )

    with _connect() as connection:
        _write_artifact(
            run_id,
            "qual_transcript",
            {
                "interviews": interviews,
                "themes": themes,
                "twin_count": len(selected_twins),
                "stimulus_count": len(selected_stimuli),
                "usage": qual_usage,
            },
            connection=connection,
        )
        logger.info("qual_research_done run_id=%s interviews=%d", run_id, len(interviews))
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE run_step
                SET status = 'succeeded', ended_at = COALESCE(ended_at, now()), updated_at = now()
                WHERE study_run_id = %s AND step_type = 'twin_preparation' AND attempt_no = 1
                """,
                (run_id,),
            )
            cursor.execute(
                """
                INSERT INTO run_step (study_run_id, step_type, status, attempt_no, started_at, ended_at)
                VALUES (%s, 'qual_execution', 'succeeded', 1, now(), now())
                ON CONFLICT (study_run_id, step_type, attempt_no) DO NOTHING
                """,
                (run_id,),
            )
            cursor.execute(
                """
                INSERT INTO run_step (study_run_id, step_type, status, attempt_no)
                VALUES (%s, 'quant_execution', 'blocked', 1)
                ON CONFLICT (study_run_id, step_type, attempt_no) DO NOTHING
                """,
                (run_id,),
            )
            cursor.execute(
                """
                INSERT INTO approval_gate (scope_type, scope_ref_id, approval_type, status)
                VALUES ('study_run', %s, 'midrun', 'requested')
                """,
                (run_id,),
            )
            cursor.execute(
                """
                UPDATE study_run SET status = 'awaiting_midrun_approval', updated_at = now()
                WHERE id = %s
                """,
                (run_id,),
            )
        connection.commit()


# ---------------------------------------------------------------------------
#  Activity 3: complete_study_run — NOW WITH AI QUANT + RECOMMENDATION
# ---------------------------------------------------------------------------

def _get_qual_artifacts(run_id: str) -> list[dict[str, Any]]:
    """Fetch qualitative artifacts for a run."""
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT artifact_manifest_json FROM artifact
                WHERE study_run_id = %s AND artifact_type = 'qual_transcript' AND status = 'ready'
                ORDER BY created_at DESC LIMIT 1
                """,
                (run_id,),
            )
            row = cur.fetchone()
    if row is None:
        return []
    manifest = row["artifact_manifest_json"]
    return manifest.get("interviews", []) if isinstance(manifest, dict) else []


def _run_quant_scoring(interviews: list[dict[str, Any]], business_question: str) -> tuple[dict[str, Any], dict[str, Any]]:
    """Use LLM to score each stimulus quantitatively based on qual data."""
    interview_summary = ""
    for interview in interviews:
        interview_summary += f"\n[{interview['twin_name']} → {interview['stimulus_name']}]\n"
        interview_summary += interview["response"][:500] + "\n"

    try:
        llm_result = chat_json_with_metadata(
            system_prompt=(
                "你是一位消费者研究定量分析师。基于定性访谈结果，对每个产品概念进行量化评分。\n"
                "评分维度：总体偏好（0-100），置信度（high/medium/low），置信度说明。\n"
                "返回 JSON：\n"
                '{\n'
                '  "ranking": [\n'
                '    {"stimulus_name": "xxx", "score": 75, "confidence": "high", "confidence_label": "82 / 高", "rationale": "评分理由"},\n'
                '    ...\n'
                '  ],\n'
                '  "scoring_methodology": "评分方法简述"\n'
                '}\n'
                "按 score 从高到低排列。"
            ),
            user_prompt=(
                f"研究问题：{business_question}\n\n"
                f"定性访谈数据摘要：\n{interview_summary}"
            ),
        )
    except Exception as exc:
        logger.warning("quant_scoring_llm_failed error=%s", exc)
        return {"ranking": [], "scoring_methodology": "评分失败"}, {}

    try:
        return json.loads(str(llm_result["content"])), dict(llm_result["usage"])
    except json.JSONDecodeError:
        logger.warning("Failed to parse quant scoring JSON")
        return {
            "ranking": [],
            "scoring_methodology": "",
            "raw": str(llm_result["content"]),
        }, dict(llm_result["usage"])


def _run_replica_scoring(
    interviews: list[dict[str, Any]],
    business_question: str,
    *,
    replicas: int = 3,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Run N independent scoring rounds and aggregate with statistics."""
    all_rounds: list[dict[str, Any]] = []
    all_usage: list[dict[str, Any]] = []

    for round_no in range(replicas):
        logger.info("replica_scoring round=%d/%d", round_no + 1, replicas)
        result, usage = _run_quant_scoring(interviews, business_question)
        all_rounds.append(result)
        all_usage.append(usage)

    stimulus_scores: dict[str, list[float]] = {}
    stimulus_meta: dict[str, dict[str, Any]] = {}
    for result in all_rounds:
        for item in result.get("ranking", []):
            name = str(item.get("stimulus_name", ""))
            score = float(item.get("score", 0))
            stimulus_scores.setdefault(name, []).append(score)
            stimulus_meta[name] = item

    ranking: list[dict[str, Any]] = []
    for name, scores in stimulus_scores.items():
        n = len(scores)
        mean = sum(scores) / n if n > 0 else 0
        variance = sum((s - mean) ** 2 for s in scores) / max(n - 1, 1)
        std = variance ** 0.5
        ci_half = 1.96 * std / (n ** 0.5) if n > 0 else 0

        if std <= 5:
            confidence = "high"
        elif std <= 12:
            confidence = "medium"
        else:
            confidence = "low"

        ranking.append({
            "stimulus_name": name,
            "score": round(mean, 1),
            "std": round(std, 1),
            "confidence_interval": f"{round(mean - ci_half, 1)} - {round(mean + ci_half, 1)}",
            "confidence": confidence,
            "confidence_label": f"{round(mean):.0f} ± {round(std, 1)} / {'高' if confidence == 'high' else '中' if confidence == 'medium' else '低'}",
            "replicas": n,
            "all_scores": scores,
            "rationale": stimulus_meta.get(name, {}).get("rationale", ""),
        })

    ranking.sort(key=lambda x: float(x["score"]), reverse=True)

    return {
        "ranking": ranking,
        "scoring_methodology": f"每个概念独立评分 {replicas} 次，取均值 ± 标准差",
        "replicas_per_stimulus": replicas,
        "total_scoring_rounds": len(all_rounds),
    }, _merge_usage(*all_usage)


def _generate_recommendation(
    qual_themes: dict[str, Any],
    quant_ranking: dict[str, Any],
    business_question: str,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Generate final recommendation based on qual + quant results."""
    try:
        llm_result = chat_json_with_metadata(
            system_prompt=(
                "你是一位高级消费者研究顾问。基于定性主题和定量排名，生成最终推荐结论。\n"
                "返回 JSON：\n"
                '{\n'
                '  "winner": "推荐产品名称",\n'
                '  "confidence_label": "82 / 高",\n'
                '  "next_action": "建议的下一步行动",\n'
                '  "supporting_text": "2-3 句话的推荐理由",\n'
                '  "segment_differences": [\n'
                '    {"segment": "人群名称", "preference": "偏好产品", "reason": "原因"}\n'
                '  ]\n'
                '}'
            ),
            user_prompt=(
                f"研究问题：{business_question}\n\n"
                f"定性主题：{json.dumps(qual_themes, ensure_ascii=False)}\n\n"
                f"定量排名：{json.dumps(quant_ranking, ensure_ascii=False)}"
            ),
        )
    except Exception as exc:
        logger.warning("recommendation_llm_failed error=%s", exc)
        return {
            "winner": "未确定",
            "confidence_label": "-- / 低",
            "next_action": "需人工复核",
            "supporting_text": "推荐结论生成失败",
        }, {}

    try:
        return json.loads(str(llm_result["content"])), dict(llm_result["usage"])
    except json.JSONDecodeError:
        logger.warning("Failed to parse recommendation JSON")
        return {
            "winner": "未确定",
            "confidence_label": "-- / 低",
            "next_action": "需人工复核",
            "supporting_text": str(llm_result["content"]),
        }, dict(llm_result["usage"])


def _complete_study_run(payload: dict[str, Optional[str]]) -> None:
    run_id = str(payload["study_run_id"])
    approved_by = payload.get("approved_by")
    decision_comment = payload.get("decision_comment")
    context = _get_study_context(run_id)

    # --- AI Quantitative Scoring ---
    logger.info("quant_scoring_start run_id=%s", run_id)

    interviews = _get_qual_artifacts(run_id)

    # Get themes from existing artifact
    qual_themes: dict[str, Any] = {}
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT artifact_manifest_json FROM artifact
                WHERE study_run_id = %s AND artifact_type = 'qual_transcript' AND status = 'ready'
                ORDER BY created_at DESC LIMIT 1
                """,
                (run_id,),
            )
            row = cur.fetchone()
            if row and isinstance(row["artifact_manifest_json"], dict):
                qual_themes = row["artifact_manifest_json"].get("themes", {})

    quant_config = context.get("quant_config_json")
    replicas = int((quant_config or {}).get("replicas", 3)) if isinstance(quant_config, dict) else 3
    quant_result, quant_usage = _run_replica_scoring(interviews, context["business_question"], replicas=replicas)
    quant_result["usage"] = quant_usage
    logger.info("quant_scoring_done run_id=%s", run_id)

    # --- AI Recommendation ---
    logger.info("recommendation_start run_id=%s", run_id)
    recommendation, recommendation_usage = _generate_recommendation(
        qual_themes,
        quant_result,
        context["business_question"],
    )
    recommendation["usage"] = recommendation_usage
    logger.info("recommendation_done run_id=%s", run_id)

    replay_manifest = _build_replay_manifest(
        context=context,
        qual_themes=qual_themes,
        quant_ranking=quant_result,
        recommendation=recommendation,
    )
    management_summary = _build_management_summary(
        context=context,
        qual_themes=qual_themes,
        quant_ranking=quant_result,
        recommendation=recommendation,
    )

    # --- State machine transitions ---
    with _connect() as connection:
        _write_artifact(run_id, "quant_ranking", quant_result, connection=connection)
        _write_artifact(run_id, "recommendation", recommendation, connection=connection)
        _write_artifact(run_id, "replay", replay_manifest, connection=connection)
        _write_artifact(run_id, "summary", management_summary, connection=connection)
        _write_formatted_artifact(
            run_id,
            "report",
            {
                "title": f"{context.get('business_question', 'AIpersona 研究报告')} 管理层简报",
                "html": _build_report_html(
                    context=context,
                    management_summary=management_summary,
                    quant_ranking=quant_result,
                ),
                "summary": management_summary,
            },
            artifact_format="html",
            storage_uri="inline://html",
            connection=connection,
        )
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE approval_gate
                SET status = 'approved', approved_by = %s, decision_comment = %s, updated_at = now()
                WHERE scope_type = 'study_run' AND scope_ref_id = %s
                  AND approval_type = 'midrun' AND status = 'requested'
                """,
                (approved_by, decision_comment, run_id),
            )
            cursor.execute(
                """
                UPDATE run_step
                SET status = 'running', started_at = COALESCE(started_at, now()), updated_at = now()
                WHERE study_run_id = %s AND step_type = 'quant_execution' AND attempt_no = 1
                """,
                (run_id,),
            )
            cursor.execute(
                """
                UPDATE run_step
                SET status = 'succeeded', ended_at = COALESCE(ended_at, now()), updated_at = now()
                WHERE study_run_id = %s AND step_type = 'quant_execution' AND attempt_no = 1
                """,
                (run_id,),
            )
            cursor.execute(
                """
                INSERT INTO run_step (study_run_id, step_type, status, attempt_no, started_at, ended_at)
                VALUES (%s, 'synthesis', 'succeeded', 1, now(), now())
                ON CONFLICT (study_run_id, step_type, attempt_no) DO NOTHING
                """,
                (run_id,),
            )
            cursor.execute(
                """
                UPDATE study_run
                SET status = 'succeeded', ended_at = COALESCE(ended_at, now()), updated_at = now()
                WHERE id = %s
                RETURNING study_id
                """,
                (run_id,),
            )
            row = cursor.fetchone()
            if row is not None:
                cursor.execute(
                    """
                    UPDATE study SET status = 'completed', updated_at = now()
                    WHERE id = %s
                    """,
                    (row["study_id"],),
                )
        connection.commit()


# ---------------------------------------------------------------------------
#  Legacy activity wrappers (kept as plain functions for backward compat)
# ---------------------------------------------------------------------------

async def mark_run_running(payload: dict[str, str]) -> None:
    await asyncio.to_thread(_mark_run_running, payload)


async def advance_to_midrun_review(payload: dict[str, str]) -> None:
    await asyncio.to_thread(_advance_to_midrun_review, payload)


async def complete_study_run(payload: dict[str, Optional[str]]) -> None:
    await asyncio.to_thread(_complete_study_run, payload)
