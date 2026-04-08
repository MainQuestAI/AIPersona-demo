import type { MidrunReviewEvent } from '@/types/demo';

export function MidrunReviewCard({
  event,
  onAction,
}: {
  event: MidrunReviewEvent;
  onAction?: (action: string) => void;
}) {
  const primaryAction = event.actions[0];
  const secondaryActions = event.actions.slice(1);

  return (
    <article className="glass-panel glass-panel--warning p-5">
      <div className="eyebrow text-warning">中途审批</div>
      <div className="mt-3 text-lg font-semibold tracking-[-0.02em] text-text">
        {event.title}
      </div>
      <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
        {event.body.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      {event.decisionSummary ? (
        <div className="mt-4 rounded-panel border border-warning/20 bg-warning/10 px-4 py-3 text-sm leading-6 text-text">
          {event.decisionSummary}
        </div>
      ) : null}
      {event.metrics && event.metrics.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {event.metrics.map((metric) => (
            <div key={metric.label} className="inner-card px-3 py-3">
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-tertiary">
                {metric.label}
              </div>
              <div className={`mt-1 text-sm font-semibold ${
                metric.tone === 'positive'
                  ? 'text-accent'
                  : metric.tone === 'warning'
                    ? 'text-warning'
                    : 'text-text'
              }`}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {event.focusThemes && event.focusThemes.length > 0 ? (
        <div className="mt-4">
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-tertiary">
            当前重点主题
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {event.focusThemes.map((theme) => (
              <span key={theme} className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                {theme}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {event.recommendation ? (
        <div className="mt-4 rounded-panel border border-line bg-surface/75 px-4 py-3 text-sm leading-6 text-muted">
          <span className="font-semibold text-text">当前建议：</span>
          {event.recommendation}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {primaryAction ? (
          <button
            key={primaryAction}
            type="button"
            onClick={() => onAction?.(primaryAction)}
            className="btn-warning"
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
