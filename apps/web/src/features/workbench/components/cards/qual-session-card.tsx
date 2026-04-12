import type { QualSessionEvent } from '@/types/demo';

// Deterministic hue from speaker label first char (consistent per persona type)
function labelToHue(label: string): number {
  const char = label.codePointAt(0) ?? 0;
  return (char * 47) % 360;
}

function PersonaAvatar({ label }: { label: string }) {
  const parts = label.split('·').map((s) => s.trim());
  const personaType = parts[0] ?? label;
  const initial = personaType.slice(0, 1);
  const hue = labelToHue(personaType);

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{
        background: `hsl(${hue} 55% 18%)`,
        border: `1px solid hsl(${hue} 55% 30%)`,
        color: `hsl(${hue} 80% 65%)`,
      }}
    >
      {initial}
    </div>
  );
}

function SpeakerMeta({ label }: { label: string }) {
  const parts = label.split('·').map((s) => s.trim());
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-text">{parts[0]}</span>
      {parts.slice(1).map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-line bg-surfaceElevated px-2 py-0.5 text-[0.6rem] text-tertiary"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

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
        {event.emergingThemes.map((theme, i) => (
          <span
            key={i}
            className="rounded-btn border border-warning/30 bg-warningSoft px-3 py-1 text-xs font-medium text-warning"
          >
            {theme}
          </span>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {event.excerpts.map((excerpt, excerptIdx) => (
          <div key={excerptIdx} className="inner-card p-4">
            {/* Persona header */}
            <div className="flex items-center gap-2.5">
              <PersonaAvatar label={excerpt.speakerLabel} />
              <SpeakerMeta label={excerpt.speakerLabel} />
            </div>
            {/* Quote lines */}
            <div className="mt-3 space-y-2 border-l-2 border-accent/20 pl-3">
              {excerpt.lines.map((line, lineIdx) => (
                <p key={lineIdx} className="text-sm leading-6 text-text/85 italic">
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
