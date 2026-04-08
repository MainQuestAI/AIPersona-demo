import type { SegmentDifferenceItem } from '@/types/demo';

export function SegmentDifferencePanel({
  items,
}: {
  items: SegmentDifferenceItem[];
}) {
  return (
    <div className="rounded-panel border border-line bg-panel p-5">
      <div className="eyebrow text-muted">分群差异</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.segmentLabel} className="inner-card p-4">
            <div className="text-sm text-muted">{item.segmentLabel}</div>
            <div className="mt-1 text-lg font-semibold text-text">{item.strongestOption}</div>
            <div className="mt-2 text-sm leading-6 text-muted">{item.keyDifference}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
