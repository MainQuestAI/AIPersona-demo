"""Build the research StateGraph."""

from __future__ import annotations

import os
from typing import Any

from langgraph.graph import END, StateGraph

from worker.graph.edges import (
    after_human_review,
    confidence_route,
    should_continue_interviewing,
)
from worker.graph.nodes import (
    complete_study,
    evaluate_confidence,
    evaluate_interview_progress,
    extract_memories_node,
    extract_themes,
    generate_recommendation_node,
    plan_research,
    request_human_review,
    run_scoring,
    run_single_interview,
)
from worker.graph.state import ResearchState


def build_research_graph() -> StateGraph:
    """Construct the research agent graph (uncompiled)."""
    graph = StateGraph(ResearchState)

    # --- Add nodes ---
    graph.add_node("plan_research", plan_research)
    graph.add_node("run_interview", run_single_interview)
    graph.add_node("evaluate_progress", evaluate_interview_progress)
    graph.add_node("extract_themes", extract_themes)
    graph.add_node("human_review", request_human_review)
    graph.add_node("run_scoring", run_scoring)
    graph.add_node("evaluate_confidence", evaluate_confidence)
    graph.add_node("generate_recommendation", generate_recommendation_node)
    graph.add_node("extract_memories", extract_memories_node)
    graph.add_node("complete_study", complete_study)

    # --- Set entry point ---
    graph.set_entry_point("plan_research")

    # --- Add edges ---

    # plan → first interview
    graph.add_edge("plan_research", "run_interview")

    # interview → evaluate progress
    graph.add_edge("run_interview", "evaluate_progress")

    # evaluate_progress → conditional
    graph.add_conditional_edges(
        "evaluate_progress",
        should_continue_interviewing,
        {
            "run_interview": "run_interview",
            "extract_themes": "extract_themes",
            "human_review": "human_review",
        },
    )

    # extract_themes → human review (midrun approval)
    graph.add_edge("extract_themes", "human_review")

    # human_review → conditional (scoring or adjust)
    graph.add_conditional_edges(
        "human_review",
        after_human_review,
        {
            "run_scoring": "run_scoring",
            "run_interview": "run_interview",
        },
    )

    # scoring → confidence check
    graph.add_edge("run_scoring", "evaluate_confidence")

    # confidence → conditional
    graph.add_conditional_edges(
        "evaluate_confidence",
        confidence_route,
        {
            "generate_recommendation": "generate_recommendation",
            "human_review": "human_review",
        },
    )

    # recommendation → memory extraction → complete → END
    graph.add_edge("generate_recommendation", "extract_memories")
    graph.add_edge("extract_memories", "complete_study")
    graph.add_edge("complete_study", END)

    return graph


def compile_graph(*, checkpointer: Any = None) -> Any:
    """Build and compile the graph, optionally with a checkpointer."""
    graph = build_research_graph()
    return graph.compile(checkpointer=checkpointer)
