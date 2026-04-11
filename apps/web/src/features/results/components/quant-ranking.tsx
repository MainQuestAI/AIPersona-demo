import type { RankingItem } from '@/types/demo';

const LEVEL_BAR_COLORS: Record<string, string> = {
  high: 'bg-accent',
  medium: 'bg-warning',
  low: 'bg-danger',
};

const LEVEL_TEXT_COLORS: Record<string, string> = {
  high: 'text-accent',
  medium: 'text-warning',
  low: 'text-danger',
};

export function QuantRanking({
  ranking,
}: {
  ranking: RankingItem[];
}) {
  const maxScore = Math.max(...ranking.map((item) => item.score), 1);

  return (
    <div className="rounded-panel border border-line bg-panel p-5">
      <div className="eyebrow text-muted">AI 综合评估</div>
      <div className="mt-4 space-y-3">
        {ranking.map((item, index) => (
          <div key={item.stimulusId} className="inner-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-muted">#{index + 1}</div>
                <div className="mt-1 text-lg font-semibold text-text">{item.label}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-text">{item.score}</div>
                <div className={`mt-1 eyebrow ${LEVEL_TEXT_COLORS[item.confidenceLevel] ?? 'text-muted'}`}>{item.confidenceLabel}</div>
              </div>
            </div>
            {/* ScoreBar */}
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surfaceElevated">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${LEVEL_BAR_COLORS[item.confidenceLevel] ?? 'bg-accent'}`}
                style={{ width: `${Math.max((item.score / maxScore) * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
