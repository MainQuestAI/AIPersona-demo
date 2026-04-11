"""Agent-driven study orchestrator.

Executes a consumer research study as a conversation, posting incremental
messages to the study_message table so the frontend can render a real-time
dialogue instead of a batch of cards.
"""

from __future__ import annotations

import json
import logging
import math
from itertools import product as cartesian_product
from typing import Any, Optional

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json

from worker.activities.study_runtime import (
    _build_management_summary,
    _build_replay_manifest,
    _build_report_html,
    _connect,
    _database_url,
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

logger = logging.getLogger(__name__)


class StudyAgent:
    """Deterministic state machine that drives a study as a conversation."""

    def __init__(self, study_id: str, run_id: str) -> None:
        self.study_id = study_id
        self.run_id = run_id

    # ------------------------------------------------------------------
    #  Message helpers
    # ------------------------------------------------------------------

    def post_message(
        self,
        role: str,
        content: str,
        *,
        message_type: str = "text",
        metadata: dict[str, Any] | None = None,
    ) -> str:
        with psycopg.connect(_database_url(), row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO study_message (study_id, role, content, message_type, metadata_json)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (self.study_id, role, content, message_type, Json(metadata or {})),
                )
                row = cur.fetchone()
            conn.commit()
        msg_id = str(row["id"])
        logger.info("agent_message study=%s type=%s id=%s", self.study_id, message_type, msg_id)
        return msg_id

    # ------------------------------------------------------------------
    #  Phase 1: Plan → Midrun (called as Temporal activity)
    # ------------------------------------------------------------------

    def run_plan_to_midrun(self) -> None:
        """Execute from study creation through qualitative research to midrun review."""
        context = _get_study_context(self.run_id)
        twins = _load_selected_twin_personas(context)
        stimuli = _load_selected_stimuli(context)
        bq = context["business_question"]

        total_idi = len(twins) * len(stimuli)
        total_calls = total_idi * 5 + 1  # 5 LLM calls per multi-turn IDI + theme extraction
        est_minutes = max(1, math.ceil(total_calls * 12 / 60))

        # --- Mark run as running ---
        self._mark_running()

        # --- Greet ---
        self.post_message(
            "agent",
            f"研究计划已就绪。\n\n"
            f"**研究问题**：{bq}\n"
            f"**配置**：{len(twins)} 个目标人群 × {len(stimuli)} 个刺激物\n"
            f"**预计**：{total_calls} 次 AI 调用，约 {est_minutes} 分钟\n\n"
            f"正在启动 AI 定性访谈...",
        )

        # --- IDI interviews (incremental) ---
        interviews: list[dict[str, Any]] = []
        pairs = list(cartesian_product(twins, stimuli))
        for idx, (twin, stimulus) in enumerate(pairs):
            self.post_message(
                "agent",
                f"正在访谈：**{twin['name']}** × **{stimulus['name']}**",
                message_type="progress",
                metadata={"phase": "qual", "current": idx + 1, "total": total_idi},
            )

            interview = _run_idi_interview(twin, stimulus, bq)
            interviews.append(interview)

            # Post a brief excerpt
            excerpt = interview["response"][:300].rstrip()
            if len(interview["response"]) > 300:
                excerpt += "..."
            self.post_message(
                "agent",
                f"**{twin['name']}** 对 **{stimulus['name']}** 的看法：\n\n> {excerpt}",
            )

        # --- Theme extraction ---
        self.post_message("agent", "所有访谈完成，正在提取定性主题...", message_type="progress",
                          metadata={"phase": "themes", "current": total_idi, "total": total_idi})

        themes, theme_usage = _extract_qual_themes(interviews, bq)
        qual_usage = _merge_usage(*(i.get("usage", {}) for i in interviews), theme_usage)

        theme_labels = themes.get("themes", [])
        overall_insight = themes.get("overall_insight", "")

        # Write qual artifact
        with _connect() as conn:
            _write_artifact(
                self.run_id,
                "qual_transcript",
                {
                    "interviews": interviews,
                    "themes": themes,
                    "twin_count": len(twins),
                    "stimulus_count": len(stimuli),
                    "usage": qual_usage,
                },
                connection=conn,
            )
            # State machine transitions
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE run_step SET status='succeeded', ended_at=now(), updated_at=now() "
                    "WHERE study_run_id=%s AND step_type='twin_preparation' AND attempt_no=1",
                    (self.run_id,),
                )
                cur.execute(
                    "INSERT INTO run_step (study_run_id, step_type, status, attempt_no, started_at, ended_at) "
                    "VALUES (%s, 'qual_execution', 'succeeded', 1, now(), now()) "
                    "ON CONFLICT (study_run_id, step_type, attempt_no) DO NOTHING",
                    (self.run_id,),
                )
                cur.execute(
                    "INSERT INTO run_step (study_run_id, step_type, status, attempt_no) "
                    "VALUES (%s, 'quant_execution', 'blocked', 1) "
                    "ON CONFLICT (study_run_id, step_type, attempt_no) DO NOTHING",
                    (self.run_id,),
                )
                cur.execute(
                    "INSERT INTO approval_gate (scope_type, scope_ref_id, approval_type, status) "
                    "VALUES ('study_run', %s, 'midrun', 'requested')",
                    (self.run_id,),
                )
                cur.execute(
                    "UPDATE study_run SET status='awaiting_midrun_approval', updated_at=now() WHERE id=%s",
                    (self.run_id,),
                )
            conn.commit()

        # Post theme summary as card
        self.post_message(
            "agent",
            f"定性阶段完成。\n\n"
            f"**{len(theme_labels)} 个核心主题**：{', '.join(theme_labels[:5])}\n\n"
            f"{overall_insight}",
            message_type="card",
            metadata={"card_type": "qual_summary", "data": themes},
        )

        # Midrun review action request
        self.post_message(
            "agent",
            f"定性探索已完成，{len(twins)} 个目标人群 × {len(stimuli)} 个刺激物的访谈都已收录。\n\n"
            "是否继续进入 AI 综合评估阶段？",
            message_type="action_request",
            metadata={
                "actions": ["继续评估", "暂停调整"],
                "action_id": "midrun_review",
            },
        )

    # ------------------------------------------------------------------
    #  Phase 2: Midrun → Complete (called after resume signal)
    # ------------------------------------------------------------------

    def run_midrun_to_complete(self, approved_by: str | None, decision_comment: str | None) -> None:
        """Execute from midrun approval through scoring to recommendation."""
        context = _get_study_context(self.run_id)
        bq = context["business_question"]

        # Read qual data
        interviews = self._get_qual_interviews()
        qual_themes = self._get_qual_themes()

        # Approve midrun
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE approval_gate SET status='approved', approved_by=%s, decision_comment=%s, updated_at=now() "
                    "WHERE scope_type='study_run' AND scope_ref_id=%s AND approval_type='midrun' AND status='requested'",
                    (approved_by, decision_comment, self.run_id),
                )
                cur.execute(
                    "UPDATE run_step SET status='running', started_at=COALESCE(started_at, now()), updated_at=now() "
                    "WHERE study_run_id=%s AND step_type='quant_execution' AND attempt_no=1",
                    (self.run_id,),
                )
            conn.commit()

        self.post_message("agent", "收到确认，正在启动 AI 综合评估...")

        # --- Replica scoring ---
        quant_config = context.get("quant_config_json")
        replicas = int((quant_config or {}).get("replicas", 3)) if isinstance(quant_config, dict) else 3

        for round_no in range(replicas):
            self.post_message(
                "agent",
                f"评分轮次 {round_no + 1}/{replicas}",
                message_type="progress",
                metadata={"phase": "quant", "current": round_no + 1, "total": replicas},
            )

        quant_result, quant_usage = _run_replica_scoring(interviews, bq, replicas=replicas)
        quant_result["usage"] = quant_usage

        self.post_message("agent", "AI 综合评估完成，正在生成推荐结论...")

        # --- Recommendation ---
        recommendation, rec_usage = _generate_recommendation(qual_themes, quant_result, bq)
        recommendation["usage"] = rec_usage

        # --- Build derived artifacts ---
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

        # --- Write all artifacts + state in one transaction ---
        with _connect() as conn:
            _write_artifact(self.run_id, "quant_ranking", quant_result, connection=conn)
            _write_artifact(self.run_id, "recommendation", recommendation, connection=conn)
            _write_artifact(self.run_id, "replay", replay_manifest, connection=conn)
            _write_artifact(self.run_id, "summary", management_summary, connection=conn)
            _write_formatted_artifact(
                self.run_id, "report",
                {
                    "title": f"{bq} 管理层简报",
                    "html": report_html,
                    "summary": management_summary,
                },
                artifact_format="html", storage_uri="inline://html", connection=conn,
            )
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE run_step SET status='succeeded', ended_at=now(), updated_at=now() "
                    "WHERE study_run_id=%s AND step_type='quant_execution' AND attempt_no=1",
                    (self.run_id,),
                )
                cur.execute(
                    "INSERT INTO run_step (study_run_id, step_type, status, attempt_no, started_at, ended_at) "
                    "VALUES (%s, 'synthesis', 'succeeded', 1, now(), now()) "
                    "ON CONFLICT (study_run_id, step_type, attempt_no) DO NOTHING",
                    (self.run_id,),
                )
                cur.execute(
                    "UPDATE study_run SET status='succeeded', ended_at=now(), updated_at=now() "
                    "WHERE id=%s RETURNING study_id",
                    (self.run_id,),
                )
                row = cur.fetchone()
                if row:
                    cur.execute("UPDATE study SET status='completed', updated_at=now() WHERE id=%s", (row["study_id"],))
            conn.commit()

        # --- Post recommendation ---
        winner = recommendation.get("winner", "待确认")
        confidence = recommendation.get("confidence_label", "-- / 中")
        supporting = recommendation.get("supporting_text", "")
        ranking = quant_result.get("ranking", [])
        ranking_text = "\n".join(
            f"  {i+1}. **{r.get('stimulus_name', '')}** — {r.get('score', 0)} 分 ({r.get('confidence_label', '')})"
            for i, r in enumerate(ranking)
        )

        self.post_message(
            "agent",
            f"## 推荐结论\n\n"
            f"**{winner}** 是当前最值得推进的方案。\n\n"
            f"{supporting}\n\n"
            f"**置信度**：{confidence}\n\n"
            f"**排名**：\n{ranking_text}",
            message_type="card",
            metadata={"card_type": "recommendation", "data": recommendation},
        )

        # --- Wrap up ---
        self.post_message(
            "agent",
            "研究已完成。你可以继续追问研究细节，或者：",
            message_type="action_request",
            metadata={
                "actions": ["下载报告", "查看详细对比", "查看研究回放"],
                "action_id": "post_study",
            },
        )

    # ------------------------------------------------------------------
    #  Helpers
    # ------------------------------------------------------------------

    def _mark_running(self) -> None:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE study_run SET status='running', started_at=COALESCE(started_at, now()), updated_at=now() WHERE id=%s",
                    (self.run_id,),
                )
                cur.execute(
                    "UPDATE run_step SET status='running', started_at=COALESCE(started_at, now()), updated_at=now() "
                    "WHERE study_run_id=%s AND step_type='twin_preparation' AND attempt_no=1",
                    (self.run_id,),
                )
            conn.commit()

    def _get_qual_interviews(self) -> list[dict[str, Any]]:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT artifact_manifest_json FROM artifact "
                    "WHERE study_run_id=%s AND artifact_type='qual_transcript' AND status='ready' "
                    "ORDER BY created_at DESC LIMIT 1",
                    (self.run_id,),
                )
                row = cur.fetchone()
        if not row:
            return []
        manifest = row["artifact_manifest_json"]
        return manifest.get("interviews", []) if isinstance(manifest, dict) else []

    def _get_qual_themes(self) -> dict[str, Any]:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT artifact_manifest_json FROM artifact "
                    "WHERE study_run_id=%s AND artifact_type='qual_transcript' AND status='ready' "
                    "ORDER BY created_at DESC LIMIT 1",
                    (self.run_id,),
                )
                row = cur.fetchone()
        if not row or not isinstance(row["artifact_manifest_json"], dict):
            return {}
        return row["artifact_manifest_json"].get("themes", {})
