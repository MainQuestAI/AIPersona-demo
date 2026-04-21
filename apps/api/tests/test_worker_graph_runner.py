from __future__ import annotations

import types
import unittest
from contextlib import contextmanager
from unittest.mock import MagicMock, patch

from worker.graph.runner import _get_checkpointer, _release_checkpointer, resume_research, start_research


class WorkerGraphRunnerTests(unittest.TestCase):
    def test_get_checkpointer_supports_context_manager_factory(self) -> None:
        fake_module = types.ModuleType("langgraph.checkpoint.postgres")

        class FakeSaver:
            def __init__(self) -> None:
                self.setup_called = False
                self.closed = False

            @classmethod
            @contextmanager
            def from_conn_string(cls, _conn_string: str):
                saver = cls()
                try:
                    yield saver
                finally:
                    saver.closed = True

            def setup(self) -> None:
                self.setup_called = True

        fake_module.PostgresSaver = FakeSaver

        with patch.dict("sys.modules", {"langgraph.checkpoint.postgres": fake_module}, clear=False):
            checkpointer = _get_checkpointer("postgresql://local/test")

        self.assertIsNotNone(checkpointer)
        self.assertTrue(checkpointer.setup_called)
        self.assertFalse(checkpointer.closed)

        _release_checkpointer(checkpointer)
        self.assertTrue(checkpointer.closed)

    @patch("worker.graph.runner._fail_run")
    @patch("worker.graph.runner._get_checkpointer", return_value=None)
    def test_start_research_marks_run_failed_when_checkpointer_is_missing(
        self,
        _get_checkpointer: MagicMock,
        fail_run: MagicMock,
    ) -> None:
        start_research("study-1", "run-1")

        fail_run.assert_called_once()
        args = fail_run.call_args.args
        self.assertEqual(args[:2], ("study-1", "run-1"))
        self.assertIn("checkpointer", args[2])

    @patch("worker.graph.runner.mark_run_failed")
    @patch("worker.graph.runner._get_checkpointer", return_value=None)
    def test_resume_research_marks_run_failed_when_checkpointer_is_missing(
        self,
        _get_checkpointer: MagicMock,
        mark_run_failed: MagicMock,
    ) -> None:
        resume_research("run-1", approved_by="boss", action="adjust_direction", decision_comment="继续访谈")

        mark_run_failed.assert_called_once()
        kwargs = mark_run_failed.call_args.kwargs
        self.assertEqual(kwargs["study_id"], "")
        self.assertEqual(kwargs["run_id"], "run-1")
        self.assertIn("checkpointer", kwargs["error_message"])

    @patch("worker.graph.runner.compile_graph")
    @patch("worker.graph.runner._get_checkpointer", return_value=object())
    def test_resume_research_passes_action_into_langgraph_command(
        self,
        _get_checkpointer: MagicMock,
        compile_graph: MagicMock,
    ) -> None:
        graph = MagicMock()
        compile_graph.return_value = graph

        fake_types = types.ModuleType("langgraph.types")

        class FakeCommand:
            def __init__(self, *, resume: dict[str, str]) -> None:
                self.resume = resume

        fake_types.Command = FakeCommand

        with patch.dict("sys.modules", {"langgraph.types": fake_types}, clear=False):
            resume_research("run-1", approved_by="boss", action="adjust_direction", decision_comment="继续访谈")

        command = graph.invoke.call_args.args[0]
        self.assertEqual(command.resume["action"], "adjust_direction")
        self.assertEqual(command.resume["approved_by"], "boss")
        self.assertEqual(command.resume["decision_comment"], "继续访谈")


if __name__ == "__main__":
    unittest.main()
