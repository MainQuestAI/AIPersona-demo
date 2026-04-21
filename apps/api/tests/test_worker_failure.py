from __future__ import annotations

import unittest
from unittest.mock import patch

from worker.graph.failure import mark_run_failed


class _FakeCursor:
    def __init__(self) -> None:
        self.executed: list[tuple[str, tuple[object, ...] | None]] = []
        self._result: dict[str, object] | None = None

    def execute(self, query: str, params: tuple[object, ...] | None = None) -> None:
        self.executed.append((query, params))
        if "SELECT study_id FROM study_run" in query:
            self._result = {"study_id": "study-1"}

    def fetchone(self) -> dict[str, object] | None:
        return self._result

    def __enter__(self) -> "_FakeCursor":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None


class _FakeConnection:
    def __init__(self) -> None:
        self.cursor_instance = _FakeCursor()
        self.committed = False

    def cursor(self) -> _FakeCursor:
        return self.cursor_instance

    def commit(self) -> None:
        self.committed = True

    def __enter__(self) -> "_FakeConnection":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None


class WorkerFailureTests(unittest.TestCase):
    @patch("worker.graph.failure.psycopg.connect")
    def test_mark_run_failed_rolls_study_back_to_planning(self, connect) -> None:
        fake_connection = _FakeConnection()
        connect.return_value = fake_connection

        mark_run_failed(
            study_id="",
            run_id="run-1",
            error_message="boom",
            database_url="postgresql://example",
        )

        queries = [query for query, _ in fake_connection.cursor_instance.executed]
        self.assertTrue(any("UPDATE study_run" in query for query in queries))
        self.assertTrue(any("UPDATE study" in query and "status='planning'" in query for query in queries))
        self.assertTrue(any("INSERT INTO study_message" in query for query in queries))
        self.assertTrue(fake_connection.committed)


if __name__ == "__main__":
    unittest.main()
