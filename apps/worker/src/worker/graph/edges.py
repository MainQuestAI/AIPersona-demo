"""Conditional edge functions for the research graph."""

from __future__ import annotations

from typing import Literal
from worker.graph.state import ResearchState


def should_continue_interviewing(
    state: ResearchState,
) -> Literal["run_interview", "extract_themes", "human_review"]:
    """After evaluating interview progress, decide next step."""
    phase = state.get("phase", "")
    if phase == "pivot_review":
        return "human_review"
    if state.get("should_continue_interviews", False):
        return "run_interview"
    return "extract_themes"


def after_human_review(
    state: ResearchState,
) -> Literal["run_scoring", "run_interview"]:
    """After human review, decide whether to proceed to scoring or adjust."""
    action = state.get("human_action", "continue")
    if action in ("adjust", "调整方向探索"):
        # User wants to adjust — go back to more interviews
        return "run_interview"
    return "run_scoring"


def confidence_route(
    state: ResearchState,
) -> Literal["generate_recommendation", "human_review"]:
    """After confidence evaluation, decide whether to recommend or ask human."""
    if state.get("confidence_sufficient", True):
        return "generate_recommendation"
    return "human_review"


def interview_or_evaluate(
    state: ResearchState,
) -> Literal["evaluate_progress", "extract_themes"]:
    """After a single interview, check if we should evaluate or just continue."""
    idx = state.get("interview_index", 0)
    pairs = state.get("interview_pairs", [])

    # Evaluate every 3 interviews, or when all are done
    if idx >= len(pairs) or idx % 3 == 0:
        return "evaluate_progress"
    return "extract_themes" if idx >= len(pairs) else "evaluate_progress"
