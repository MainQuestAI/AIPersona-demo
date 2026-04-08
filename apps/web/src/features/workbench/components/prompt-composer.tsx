import { useState } from 'react';
import { SendHorizontal } from 'lucide-react';

export function PromptComposer({
  suggestions,
  onSend,
}: {
  suggestions: string[];
  onSend?: (message: string) => void;
}) {
  const [input, setInput] = useState('');

  function handleSend() {
    if (!input.trim()) return;
    onSend?.(input.trim());
    setInput('');
  }

  return (
    <section>
      <div className="glass-panel p-3">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入您的研究问题..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text placeholder:text-tertiary focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="btn-primary flex h-9 w-9 shrink-0 !p-0"
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>

        {suggestions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSend?.(suggestion)}
                className="btn-chip"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
