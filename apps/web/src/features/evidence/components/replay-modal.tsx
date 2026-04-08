import type { ReplayData } from '@/types/demo';
import { useDialogAccessibility } from './use-dialog-accessibility';

export function ReplayModal({
  open,
  replay,
  onClose,
}: {
  open: boolean;
  replay: ReplayData;
  onClose: () => void;
}) {
  const dialogRef = useDialogAccessibility(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(3,3,5,0.70)' }} onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="研究回放"
        tabIndex={-1}
        className="absolute inset-6 z-10 mx-auto flex max-w-5xl flex-col rounded-panel border border-line p-6 backdrop-blur-xl"
        style={{ background: 'rgba(3,3,5,0.95)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="eyebrow text-muted">研究回放</div>
            <div className="mt-2 text-2xl font-semibold text-text">{replay.title}</div>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary">关闭</button>
        </div>
        {replay.summary || replay.nextAction ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {replay.summary ? (
              <div className="inner-card p-4">
                <div className="eyebrow text-muted">这次研究得出了什么</div>
                <div className="mt-2 text-sm leading-6 text-text">{replay.summary}</div>
              </div>
            ) : null}
            {replay.nextAction ? (
              <div className="inner-card p-4">
                <div className="eyebrow text-muted">建议下一步</div>
                <div className="mt-2 text-sm leading-6 text-text">{replay.nextAction}</div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-6 grid flex-1 gap-4 overflow-auto md:grid-cols-2">
          {replay.stages.map((stage) => (
            <div key={stage.id} className="glass-panel p-5">
              <div className="eyebrow text-accent">{stage.label}</div>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="eyebrow text-muted">输入</div>
                  <div className="mt-2 space-y-1 text-text">
                    {stage.inputs.map((item, i) => <div key={i}>{item}</div>)}
                  </div>
                </div>
                <div>
                  <div className="eyebrow text-muted">输出</div>
                  <div className="mt-2 space-y-1 text-text">
                    {stage.outputs.map((item, i) => <div key={i}>{item}</div>)}
                  </div>
                </div>
                <div>
                  <div className="eyebrow text-muted">决策</div>
                  <div className="mt-2 space-y-1 text-text">
                    {stage.decisions.map((item, i) => <div key={i}>{item}</div>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
