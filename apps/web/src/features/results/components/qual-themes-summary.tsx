import type { QualThemeGroup } from '@/types/demo';

export function QualThemesSummary({
  groups,
}: {
  groups: QualThemeGroup[];
}) {
  return (
    <div className="rounded-panel border border-line bg-panel p-5">
      <div className="eyebrow text-muted">定性主题</div>
      <div className="mt-4 space-y-3">
        {groups.map((group) => (
          <div key={group.stimulusId} className="inner-card p-4">
            <div className="text-lg font-semibold text-text">{group.label}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.themes.map((theme) => (
                <span
                  key={theme}
                  className="rounded-btn border border-warning/30 bg-warningSoft px-3 py-1 text-xs text-warning"
                >
                  {theme}
                </span>
              ))}
            </div>
            <div className="mt-3 text-sm leading-6 text-muted">{group.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
