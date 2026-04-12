"""SSE streaming helpers for LLM chat responses.

Supports two modes:
- Standard streaming (all models): token-by-token content delivery
- Thinking + streaming (qwen3/QwQ): reasoning_content first, then content
"""

from __future__ import annotations

import json
import logging
from typing import Any, Iterator

from fastapi.responses import StreamingResponse
from openai import OpenAI

logger = logging.getLogger(__name__)


def model_supports_thinking(model: str) -> bool:
    """Check if the model supports enable_thinking (extended reasoning)."""
    return any(k in model.lower() for k in ("qwen3", "qwq", "thinking", "reasoner"))


def create_llm_stream(
    client: OpenAI,
    model: str,
    messages: list[dict[str, Any]],
    *,
    max_tokens: int = 2048,
    temperature: float = 0.7,
    enable_thinking: bool = False,
) -> StreamingResponse:
    """Create an SSE StreamingResponse from an OpenAI-compatible streaming call.

    SSE event format:
      data: {"type": "thinking", "content": "..."}   # reasoning tokens (if thinking enabled)
      data: {"type": "content", "content": "..."}    # response tokens
      data: {"type": "done"}                          # stream complete
    """

    def generate() -> Iterator[str]:
        try:
            extra_kwargs: dict[str, Any] = {}
            call_temperature = temperature
            if enable_thinking and model_supports_thinking(model):
                extra_kwargs["extra_body"] = {"enable_thinking": True}
                # qwen3 thinking mode requires temperature=None or specific values
                call_temperature = None  # type: ignore[assignment]

            stream = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=call_temperature,
                stream=True,
                **extra_kwargs,
            )

            for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta

                # Thinking / reasoning content (qwen3/QwQ specific)
                reasoning = getattr(delta, "reasoning_content", None)
                if reasoning:
                    yield _sse({"type": "thinking", "content": reasoning})

                # Normal content
                if delta.content:
                    yield _sse({"type": "content", "content": delta.content})

            yield _sse({"type": "done"})

        except Exception as exc:
            logger.warning("llm_stream_error: %s", exc)
            yield _sse({"type": "error", "content": f"LLM 调用失败：{type(exc).__name__}"})
            yield _sse({"type": "done"})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


def _sse(data: dict[str, Any]) -> str:
    """Format a single SSE event."""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
