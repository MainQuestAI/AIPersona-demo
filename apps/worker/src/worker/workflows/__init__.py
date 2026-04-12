"""Workflows module — now powered by LangGraph (see worker.graph)."""

# Legacy workflow classes kept as stubs for import compatibility
from worker.workflows.study_workflow import AgentStudyWorkflow, LegacyStudyWorkflow, StudyWorkflow

__all__ = ["AgentStudyWorkflow", "LegacyStudyWorkflow", "StudyWorkflow"]
