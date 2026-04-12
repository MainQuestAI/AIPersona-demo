"""AIpersona MCP Server — exposes consumer research tools for external AI agents.

Run with:
    fastmcp run aipersona_mcp.server:mcp

Or programmatically:
    python -m aipersona_mcp.server
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from fastmcp import FastMCP

API_BASE = os.environ.get("AIPERSONA_API_URL", "http://127.0.0.1:8000")
API_KEY = os.environ.get("AIPERSONA_API_KEY", "")

mcp = FastMCP(
    "AIpersona Research",
    description=(
        "AI Consumer Research workbench. Create studies, chat with synthetic "
        "consumer personas, run AI-driven interviews, and get research reports."
    ),
)


def _headers() -> dict[str, str]:
    h: dict[str, str] = {"Content-Type": "application/json"}
    if API_KEY:
        h["X-API-Key"] = API_KEY
    return h


async def _request(method: str, path: str, **kwargs: Any) -> Any:
    async with httpx.AsyncClient(base_url=API_BASE, timeout=120) as client:
        resp = await client.request(method, path, headers=_headers(), **kwargs)
        resp.raise_for_status()
        return resp.json()


# ---------------------------------------------------------------------------
#  Tool 1: Create a new consumer research study
# ---------------------------------------------------------------------------

@mcp.tool()
async def aipersona_study_create(
    business_question: str,
    study_type: str = "concept_screening",
    brand: str = "Demo",
    category: str = "Consumer goods",
) -> dict[str, Any]:
    """Create a new AI consumer research study and start the agent.

    Args:
        business_question: The core research question (e.g. "Which concept should we pursue?")
        study_type: Type of study (concept_screening, naming_test, communication_test)
        brand: Brand name for this study
        category: Product category
    """
    # Bootstrap seed assets first
    seed = await _request("POST", "/bootstrap/seed-assets")
    twin_ids = [t["id"] for t in seed.get("twin_versions", [])]
    stim_ids = [s["id"] for s in seed.get("stimuli", [])]

    bundle = await _request("POST", "/studies", json={
        "business_question": business_question,
        "study_type": study_type,
        "brand": brand,
        "category": category,
        "target_groups": ["消费者"],
        "business_goal": {"objective": business_question, "decision": "winner_selection"},
        "twin_version_ids": twin_ids,
        "stimulus_ids": stim_ids,
        "qual_config": {"mode": "ai_idi", "interviews": len(twin_ids) * len(stim_ids)},
        "quant_config": {"mode": "replica_scoring", "replicas": 3},
        "generated_by": "mcp_agent",
        "approval_required": True,
    })

    study_id = bundle["study"]["id"]

    # Start the agent to present the plan
    agent_result = await _request("POST", f"/studies/{study_id}/agent/start")

    return {
        "study_id": study_id,
        "status": agent_result.get("status", "created"),
        "plan_version_id": agent_result.get("plan_version_id"),
        "message": f"Study created. Use aipersona_study_messages to see the plan, then aipersona_study_reply to confirm.",
    }


# ---------------------------------------------------------------------------
#  Tool 2: Get agent conversation messages
# ---------------------------------------------------------------------------

@mcp.tool()
async def aipersona_study_messages(
    study_id: str,
    after_id: str | None = None,
) -> dict[str, Any]:
    """Get agent conversation messages for a study.

    Args:
        study_id: The study UUID
        after_id: Optional message ID to get only newer messages
    """
    params = f"?after={after_id}" if after_id else ""
    return await _request("GET", f"/studies/{study_id}/agent/messages{params}")


# ---------------------------------------------------------------------------
#  Tool 3: Reply to agent (confirm plan, approve midrun, or free chat)
# ---------------------------------------------------------------------------

@mcp.tool()
async def aipersona_study_reply(
    study_id: str,
    action: str,
    action_id: str = "",
    comment: str | None = None,
) -> dict[str, Any]:
    """Reply to an agent action request or send a free-form message.

    Args:
        study_id: The study UUID
        action: The action text (e.g. "开始执行", "继续评估") or a free-form question
        action_id: The action_id from the action_request message (e.g. "confirm_plan", "midrun_review")
        comment: Optional comment
    """
    return await _request("POST", f"/studies/{study_id}/agent/reply", json={
        "action_id": action_id,
        "action": action,
        "comment": comment,
    })


# ---------------------------------------------------------------------------
#  Tool 4: Search personas
# ---------------------------------------------------------------------------

@mcp.tool()
async def aipersona_persona_search(
    query: str = "",
) -> list[dict[str, Any]]:
    """Search available consumer personas (digital twins).

    Args:
        query: Optional search query to filter by name or audience label
    """
    twins = await _request("GET", "/consumer-twins")
    if not query:
        return twins

    q = query.lower()
    return [
        t for t in twins
        if q in str(t.get("persona_profile_snapshot_json", {}).get("name", "")).lower()
        or q in str(t.get("target_audience_label", "")).lower()
    ]


# ---------------------------------------------------------------------------
#  Tool 5: Chat with a persona
# ---------------------------------------------------------------------------

@mcp.tool()
async def aipersona_persona_chat(
    profile_id: str,
    message: str,
    history: list[dict[str, str]] | None = None,
) -> dict[str, str]:
    """Chat with a consumer persona independently (outside study context).

    Args:
        profile_id: The persona profile UUID (use consumer twin ID)
        message: Your message to the persona
        history: Optional conversation history [{role, content}, ...]
    """
    return await _request("POST", f"/persona-profiles/{profile_id}/chat", json={
        "message": message,
        "history": history or [],
    })


# ---------------------------------------------------------------------------
#  Tool 6: Get study report
# ---------------------------------------------------------------------------

@mcp.tool()
async def aipersona_study_report(
    study_id: str,
) -> dict[str, str]:
    """Get the research report URL for a completed study.

    Args:
        study_id: The study UUID
    """
    return {
        "report_url": f"{API_BASE}/studies/{study_id}/report",
        "share_url": f"{API_BASE}/studies/{study_id}/share",
        "replay_url": f"{API_BASE}/studies/{study_id}/replay",
    }


# ---------------------------------------------------------------------------
#  Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run()
