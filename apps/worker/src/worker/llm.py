"""Thin wrapper around DashScope (Alibaba Cloud) LLM API via OpenAI-compatible SDK."""

from __future__ import annotations

import logging
import os
from typing import Any

from openai import OpenAI

logger = logging.getLogger(__name__)

_DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"


class LLMRequestError(RuntimeError):
    """Raised when the upstream LLM provider request fails."""


def _get_float_env(name: str, default: str) -> float:
    return float(os.getenv(name, default) or default)


def _get_int_env(name: str, default: str) -> int:
    return int(os.getenv(name, default) or default)


def _get_client() -> OpenAI:
    from worker.config import get_settings

    settings = get_settings()
    api_key = settings.dashscope_api_key
    if not api_key:
        raise RuntimeError("DASHSCOPE_API_KEY is required for LLM calls")
    return OpenAI(
        api_key=api_key,
        base_url=_DASHSCOPE_BASE_URL,
        timeout=_get_float_env("DASHSCOPE_TIMEOUT_SECONDS", "45"),
        max_retries=_get_int_env("DASHSCOPE_MAX_RETRIES", "3"),
    )


def _usage_to_dict(response: Any, model: str) -> dict[str, Any]:
    usage = getattr(response, "usage", None)
    prompt_tokens = int(getattr(usage, "prompt_tokens", 0) or 0)
    completion_tokens = int(getattr(usage, "completion_tokens", 0) or 0)
    total_tokens = int(getattr(usage, "total_tokens", prompt_tokens + completion_tokens) or 0)
    input_cost_per_1k = _get_float_env("DASHSCOPE_INPUT_COST_PER_1K", "0")
    output_cost_per_1k = _get_float_env("DASHSCOPE_OUTPUT_COST_PER_1K", "0")
    cost_estimate = round(
        (prompt_tokens / 1000 * input_cost_per_1k) + (completion_tokens / 1000 * output_cost_per_1k),
        4,
    )
    return {
        "model": str(getattr(response, "model", None) or model),
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
        "cost_estimate": cost_estimate,
    }


def chat_with_metadata(
    system_prompt: str,
    user_prompt: str,
    *,
    model: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.7,
) -> dict[str, Any]:
    if not model:
        from worker.config import get_settings
        model = get_settings().dashscope_model or "qwen-plus"
    client = _get_client()

    logger.info("llm_call_start model=%s prompt_len=%d", model, len(user_prompt))

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
    except Exception as exc:  # pragma: no cover - exercised via mocks
        logger.exception("llm_call_failed model=%s prompt_len=%d", model, len(user_prompt))
        raise LLMRequestError(f"LLM request failed for model {model}") from exc

    if not response.choices:
        raise LLMRequestError(f"LLM returned empty choices for model {model}")
    content = response.choices[0].message.content or ""
    usage = _usage_to_dict(response, model)
    logger.info(
        "llm_call_done model=%s reply_len=%d prompt_tokens=%d completion_tokens=%d",
        usage["model"],
        len(content),
        usage["prompt_tokens"],
        usage["completion_tokens"],
    )
    return {
        "content": content,
        "usage": usage,
    }


def chat(
    system_prompt: str,
    user_prompt: str,
    *,
    model: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.7,
) -> str:
    """Single-turn chat completion. Returns the assistant message content."""
    return str(
        chat_with_metadata(
            system_prompt,
            user_prompt,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
        )["content"]
    )


def chat_json_with_metadata(
    system_prompt: str,
    user_prompt: str,
    *,
    model: str | None = None,
    max_tokens: int = 4096,
) -> dict[str, Any]:
    json_system = system_prompt + "\n\n你必须以有效 JSON 格式回复，不要添加 markdown 代码块标记。"
    return chat_with_metadata(json_system, user_prompt, model=model, max_tokens=max_tokens, temperature=0.3)


def chat_json(
    system_prompt: str,
    user_prompt: str,
    *,
    model: str | None = None,
    max_tokens: int = 4096,
) -> str:
    """Chat completion that nudges the model to return valid JSON."""
    return str(chat_json_with_metadata(system_prompt, user_prompt, model=model, max_tokens=max_tokens)["content"])
