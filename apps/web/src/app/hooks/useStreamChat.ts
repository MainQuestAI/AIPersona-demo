/**
 * SSE streaming hook for LLM chat responses.
 *
 * Consumes server-sent events with three event types:
 *   { type: "thinking", content: "..." }  — reasoning tokens (qwen3/QwQ)
 *   { type: "content",  content: "..." }  — response tokens
 *   { type: "done" }                      — stream complete
 */

export type StreamState = {
  thinking: string;
  content: string;
  isThinking: boolean;
  isDone: boolean;
};

export async function sendStreamChat(
  url: string,
  body: Record<string, unknown>,
  onUpdate: (state: StreamState) => void,
): Promise<StreamState> {
  const separator = url.includes('?') ? '&' : '?';
  const resp = await fetch(`${url}${separator}stream=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const fallback: StreamState = {
      thinking: '',
      content: '请求失败，请重试。',
      isThinking: false,
      isDone: true,
    };
    onUpdate(fallback);
    return fallback;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let state: StreamState = { thinking: '', content: '', isThinking: false, isDone: false };
  let buffer = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const data = JSON.parse(trimmed.slice(6)) as {
          type: 'thinking' | 'content' | 'done' | 'error';
          content?: string;
        };

        if (data.type === 'thinking' && data.content) {
          state = { ...state, thinking: state.thinking + data.content, isThinking: true };
        } else if (data.type === 'content' && data.content) {
          state = { ...state, content: state.content + data.content, isThinking: false };
        } else if (data.type === 'error' && data.content) {
          state = { ...state, content: state.content + data.content, isThinking: false };
        } else if (data.type === 'done') {
          state = { ...state, isDone: true, isThinking: false };
        }

        onUpdate(state);
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  if (!state.isDone) {
    state = { ...state, isDone: true };
    onUpdate(state);
  }

  return state;
}
