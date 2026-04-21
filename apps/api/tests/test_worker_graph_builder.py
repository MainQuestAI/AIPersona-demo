from __future__ import annotations

import unittest

from worker.graph.builder import build_research_graph


class WorkerGraphBuilderTests(unittest.TestCase):
    def test_build_research_graph_on_python39_compatible_state_schema(self) -> None:
        graph = build_research_graph()
        self.assertIsNotNone(graph)


if __name__ == "__main__":
    unittest.main()
