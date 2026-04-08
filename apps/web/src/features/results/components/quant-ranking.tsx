import type { RankingItem } from '@/types/demo';

export function QuantRanking({
  ranking,
}: {
  ranking: RankingItem[];
}) {
  return (
    <div className="rounded-panel border border-line bg-panel p-5">
      <div className="eyebrow text-muted">量化排名</div>
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
                <div className="mt-1 eyebrow text-muted">{item.confidenceLabel}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
