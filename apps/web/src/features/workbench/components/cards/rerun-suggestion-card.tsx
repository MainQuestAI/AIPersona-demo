import type { RerunSuggestionEvent } from '@/types/demo';

export function RerunSuggestionCard({
  event,
  onAction,
}: {
  event: RerunSuggestionEvent;
  onAction?: (action: string) => void;
}) {
  const primaryAction = event.actions[0];
  const secondaryActions = event.actions.slice(1);

  return (
    <article className="glass-panel glass-panel--action p-5">
      <div className="eyebrow text-action">重跑建议</div>
      <div className="mt-3 text-lg font-semibold tracking-[-0.02em] text-text">
        {event.title}
      </div>
      <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
        {event.reason.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {primaryAction ? (
          <button
            key={primaryAction}
            type="button"
            onClick={() => onAction?.(primaryAction)}
            className="btn-action"
          >
            {primaryAction}
          </button>
        ) : null}
        {secondaryActions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onAction?.(action)}
            className="btn-secondary"
          >
            {action}
          </button>
        ))}
      </div>
    </article>
  );
}
