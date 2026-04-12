import { Brain, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function ThinkingBlock({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!content) return null;

  return (
    <div className="mb-2 rounded-lg border border-accent/20 bg-accent/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-accent/10"
      >
        <Brain className={`h-3.5 w-3.5 text-accent ${isStreaming ? 'animate-pulse' : ''}`} />
        <span className="text-[0.65rem] font-medium text-accent">
          {isStreaming ? '正在思考...' : '思考过程'}
        </span>
        <span className="text-[0.6rem] text-tertiary ml-auto">
          {content.length} 字
        </span>
        <ChevronDown className={`h-3 w-3 text-tertiary transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="border-t border-accent/10 px-3 py-2 text-[0.7rem] leading-5 text-tertiary whitespace-pre-wrap max-h-[200px] overflow-y-auto">
          {content}
        </div>
      ) : null}
    </div>
  );
}
