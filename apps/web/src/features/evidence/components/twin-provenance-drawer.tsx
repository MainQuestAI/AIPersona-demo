import type { TwinProfile } from '@/types/demo';
import { DrawerShell } from './drawer-shell';

export function TwinProvenanceDrawer({
  open,
  twins,
  onClose,
}: {
  open: boolean;
  twins: TwinProfile[];
  onClose: () => void;
}) {
  return (
    <DrawerShell open={open} onClose={onClose} ariaLabel="孪生溯源面板">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="eyebrow text-muted">孪生溯源面板</div>
            <div className="mt-2 text-2xl font-semibold text-text">企业自有数字孪生</div>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary">关闭</button>
        </div>
        <div className="mt-6 grid gap-4">
          {twins.map((twin) => (
            <div key={twin.id} className="glass-panel p-5">
              <div className="text-lg font-semibold text-text">{twin.name}</div>
              <div className="mt-2 text-sm leading-6 text-muted">{twin.versionNotes}</div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div className="inner-card px-3 py-2">
                  <span className="text-tertiary">构建来源：</span>
                  <span className="text-text">{twin.builtFrom}</span>
                </div>
                <div className="inner-card px-3 py-2">
                  <span className="text-tertiary">目标受众：</span>
                  <span className="text-text">{twin.audienceLabel}</span>
                </div>
                <div className="inner-card px-3 py-2">
                  <span className="text-tertiary">年龄范围：</span>
                  <span className="text-text">{twin.ageRange}</span>
                </div>
                <div className="inner-card px-3 py-2">
                  <span className="text-tertiary">研究就绪度：</span>
                  <span className="text-text">{twin.researchReadiness.join(' / ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
    </DrawerShell>
  );
}
