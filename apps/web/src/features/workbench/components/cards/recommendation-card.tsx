import type { RecommendationEvent } from '@/types/demo';

export function RecommendationCard({
  event,
  onAction,
}: {
  event: RecommendationEvent;
  onAction?: (action: string) => void;
}) {
  return (
    <article className="glass-panel glass-panel--accent p-5">
      <div className="eyebrow text-accent">推荐结论</div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="text-2xl font-semibold tracking-[-0.03em] text-text">
          {event.winner}
        </div>
        <span className="rounded-btn border border-accent/35 bg-accentSoft px-3 py-1 font-mono text-xs font-semibold text-accent">
          置信度 {event.confidence}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{event.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {event.actions.map((action, i) => (
          <button
            key={action}
            type="button"
            onClick={() => onAction?.(action)}
            className={i === 0 ? 'btn-primary' : 'btn-secondary'}
          >
            {action}
          </button>
        ))}
      </div>
    </article>
  );
}
