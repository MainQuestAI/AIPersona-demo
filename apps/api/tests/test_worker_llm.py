from __future__ import annotations

import os
import unittest
from unittest.mock import MagicMock, patch

from worker.llm import LLMRequestError, chat_with_metadata


class WorkerLlmTests(unittest.TestCase):
    def setUp(self) -> None:
        self.original_env = dict(os.environ)
        os.environ["DASHSCOPE_API_KEY"] = "test-key"
        os.environ["DASHSCOPE_MODEL"] = "qwen-plus"
        os.environ["DASHSCOPE_TIMEOUT_SECONDS"] = "45"
        os.environ["DASHSCOPE_MAX_RETRIES"] = "3"

    def tearDown(self) -> None:
        os.environ.clear()
        os.environ.update(self.original_env)

    @patch("worker.llm.OpenAI")
    def test_chat_with_metadata_builds_client_with_timeout_and_retries(self, openai_cls: MagicMock) -> None:
        response = MagicMock()
        response.choices = [MagicMock(message=MagicMock(content="ok"))]
        response.usage = MagicMock(prompt_tokens=12, completion_tokens=8, total_tokens=20)
        response.model = "qwen-plus"

        client = MagicMock()
        client.chat.completions.create.return_value = response
        openai_cls.return_value = client

        result = chat_with_metadata("system", "user")

        self.assertEqual(result["content"], "ok")
        openai_cls.assert_called_once_with(
            api_key="test-key",
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            timeout=45.0,
            max_retries=3,
        )

    @patch("worker.llm.OpenAI")
    def test_chat_with_metadata_wraps_provider_failures(self, openai_cls: MagicMock) -> None:
        client = MagicMock()
        client.chat.completions.create.side_effect = RuntimeError("network down")
        openai_cls.return_value = client

        with self.assertRaises(LLMRequestError):
            chat_with_metadata("system", "user")


if __name__ == "__main__":
    unittest.main()
