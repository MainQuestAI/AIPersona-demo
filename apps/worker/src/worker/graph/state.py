"""Research state definition for the LangGraph agent."""

from __future__ import annotations

import operator
from typing import Annotated, Any, TypedDict


class InterviewResult(TypedDict, total=False):
    twin_id: str
    twin_name: str
    stimulus_id: str
    stimulus_name: str
    response: str
    transcript: list[dict[str, str]]
    usage: dict[str, Any]


class ResearchState(TypedDict, total=False):
    # Identifiers
    study_id: str
    run_id: str

    # Research context
    business_question: str
    twins: list[dict[str, Any]]
    stimuli: list[dict[str, Any]]

    # Interview tracking
    interviews: Annotated[list[dict[str, Any]], operator.add]
    interview_pairs: list[tuple[int, int]]  # (twin_idx, stimulus_idx) queue
    interview_index: int

    # Analysis results
    qual_themes: dict[str, Any]
    quant_result: dict[str, Any]
    recommendation: dict[str, Any]
    memories: list[dict[str, Any]]

    # Accumulated usage
    total_usage: dict[str, Any]

    # Phase tracking
    phase: str  # plan, qual, review, quant, recommend, complete

    # Decision state (set by LLM evaluator nodes)
    should_continue_interviews: bool
    confidence_sufficient: bool
    pivot_reason: str  # why agent wants to change direction

    # Human-in-the-loop
    human_feedback: str | None
    human_action: str | None  # e.g. "continue", "adjust", "stop"
