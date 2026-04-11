import { useState } from 'react';
import type { PlanApprovalEvent } from '@/types/demo';

export function PlanApprovalCard({
  event,
  onAction,
}: {
  event: PlanApprovalEvent;
  onAction?: (action: string) => void;
}) {
  const primaryAction = event.actions[0];
  const secondaryActions = event.actions.slice(1);
  const [confirming, setConfirming] = useState(false);

  function handlePrimaryClick() {
    if (!primaryAction) return;
    if (primaryAction === '批准计划' && !confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setConfirming(false);
    onAction?.(primaryAction);
  }

  return (
    <article className="glass-panel glass-panel--action p-5">
      <div className="eyebrow text-action">研究计划审批</div>
      <div className="mt-3 text-lg font-semibold tracking-[-0.02em] text-text">
        {event.primaryText}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{event.secondaryText}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="inner-card px-3 py-2 text-sm">
          <span className="text-tertiary">研究类型：</span>
          <span className="text-text">{event.summary.studyType}</span>
        </div>
        <div className="inner-card px-3 py-2 text-sm">
          <span className="text-tertiary">目标人群：</span>
          <span className="text-text">{event.summary.targetGroupCount}</span>
        </div>
        <div className="inner-card px-3 py-2 text-sm">
          <span className="text-tertiary">刺激物：</span>
          <span className="text-text">{event.summary.stimuliCount}</span>
        </div>
        <div className="inner-card px-3 py-2 text-sm">
          <span className="text-tertiary">预估时长：</span>
          <span className="text-text">{event.summary.estimatedRuntimeMin} 分钟</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {primaryAction ? (
          <button
            key={primaryAction}
            type="button"
            onClick={handlePrimaryClick}
            className={confirming ? 'btn-warning' : 'btn-primary'}
          >
            {confirming ? '确认批准？' : primaryAction}
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
