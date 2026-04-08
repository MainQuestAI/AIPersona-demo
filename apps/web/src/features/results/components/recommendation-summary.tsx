import type { RecommendationSummaryData } from '@/types/demo';

export function RecommendationSummary({
  recommendation,
}: {
  recommendation: RecommendationSummaryData;
}) {
  return (
    <div className="rounded-panel border border-accent/30 bg-accentSoft p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow text-accent">推荐结论</div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="text-3xl font-semibold tracking-[-0.03em] text-text">{recommendation.winner}</div>
            <span className="rounded-btn border border-accent/35 bg-panel px-3 py-1 font-mono text-xs text-accent">
              置信度 {recommendation.confidenceLabel}
            </span>
          </div>
        </div>
        <div className="inner-card px-4 py-3 text-right">
          <div className="eyebrow text-accent">下一步行动</div>
          <div className="mt-1.5 text-sm font-medium text-text">
            {recommendation.nextAction}
          </div>
        </div>
      </div>
      <div className="mt-4 inner-card px-4 py-3 text-sm leading-7 text-muted">
        {recommendation.supportingText}
      </div>
    </div>
  );
}
