import type { QualSessionEvent } from '@/types/demo';

export function QualSessionCard({ event }: { event: QualSessionEvent }) {
  return (
    <article className="glass-panel p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow rounded-btn border border-accent/30 bg-accentSoft px-3 py-1 text-accent">
          定性访谈
        </span>
        <span className="rounded-btn border border-line bg-panel px-3 py-1 font-mono text-[0.65rem] font-semibold tracking-[0.02em] text-muted">
          {event.completedSessionsLabel}
        </span>
      </div>
      <div className="mt-3 text-sm leading-6 text-muted">
        {event.helperText}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {event.emergingThemes.map((theme) => (
          <span
            key={theme}
            className="rounded-btn border border-warning/30 bg-warningSoft px-3 py-1 text-xs font-medium text-warning"
          >
            {theme}
          </span>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        {event.excerpts.map((excerpt) => (
          <div
            key={excerpt.speakerLabel}
            className="inner-card p-4"
          >
            <div className="eyebrow text-muted">
              {excerpt.speakerLabel}
            </div>
            <div className="mt-2 space-y-2 text-sm leading-6 text-text/90">
              {excerpt.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
