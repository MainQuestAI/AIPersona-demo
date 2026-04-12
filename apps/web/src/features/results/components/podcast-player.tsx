import { Loader2, Mic, Radio } from 'lucide-react';
import { useState } from 'react';

import { generatePodcast, type PodcastResult } from '@/app/services/studyRuntime';

export function PodcastPlayer({ studyId }: { studyId: string }) {
  const [state, setState] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [podcast, setPodcast] = useState<PodcastResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function handleGenerate() {
    setState('generating');
    try {
      const result = await generatePodcast(studyId);
      setPodcast(result);
      setState('ready');
    } catch {
      setState('error');
    }
  }

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={() => void handleGenerate()}
        className="flex w-full items-center gap-3 rounded-panel border border-line bg-panel p-4 text-left transition hover:border-accent/30"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Radio className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-medium text-text">研究速读</div>
          <div className="text-[0.65rem] text-muted">AI 将研究发现转化为可读摘要</div>
        </div>
      </button>
    );
  }

  if (state === 'generating') {
    return (
      <div className="flex items-center gap-3 rounded-panel border border-accent/20 bg-accent/5 p-4">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
        <div className="text-sm text-muted">正在生成研究速读...</div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="rounded-panel border border-danger/30 bg-panel p-4">
        <div className="text-sm text-danger">研究速读生成失败</div>
        <button type="button" onClick={() => void handleGenerate()} className="mt-2 text-[0.65rem] text-accent hover:underline">
          重试
        </button>
      </div>
    );
  }

  // Ready state
  return (
    <div className="rounded-panel border border-accent/20 bg-panel overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Mic className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-text">研究速读</div>
          <div className="text-[0.65rem] text-muted">
            预计 {podcast?.duration_estimate ?? '3 分钟'} · AI 生成研究速读
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="btn-secondary-sm"
        >
          {expanded ? '收起' : '展开'}
        </button>
      </div>
      {expanded && podcast ? (
        <div className="border-t border-line p-4">
          <div className="text-sm leading-7 text-muted whitespace-pre-wrap">
            {podcast.script}
          </div>
        </div>
      ) : null}
    </div>
  );
}
