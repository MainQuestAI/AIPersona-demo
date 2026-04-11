import type { LibraryRecord, StudyInputsSnapshot } from '@/types/demo';
import { DrawerShell } from './drawer-shell';

export function InputSourcesDrawer({
  open,
  inputsSnapshot,
  selectedStimuli,
  libraryRecords,
  onClose,
}: {
  open: boolean;
  inputsSnapshot: StudyInputsSnapshot;
  selectedStimuli: string[];
  libraryRecords: LibraryRecord[];
  onClose: () => void;
}) {
  return (
    <DrawerShell open={open} onClose={onClose} ariaLabel="输入源面板">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="eyebrow text-muted">输入源面板</div>
            <div className="mt-2 text-2xl font-semibold text-text">研究输入与来源</div>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary">关闭</button>
        </div>
        <div className="mt-6 space-y-4">
          <div className="inner-card p-4">
            <div className="eyebrow text-muted">构建来源</div>
            <div className="mt-2 text-sm text-text">{inputsSnapshot.builtFrom}</div>
          </div>
          <div className="inner-card p-4">
            <div className="eyebrow text-muted">选定刺激物</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedStimuli.map((stimulus) => (
                <span key={stimulus} className="btn-chip cursor-default border border-accent/30 text-accent">
                  {stimulus}
                </span>
              ))}
            </div>
          </div>
          <div className="inner-card p-4">
            <div className="eyebrow text-muted">归档记录</div>
            <div className="mt-3 space-y-2">
              {libraryRecords.map((record) => (
                <div key={record.id} className="inner-card px-4 py-3">
                  <div className="text-sm text-text">{record.label}</div>
                  <div className="mt-1 eyebrow text-muted">{record.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </DrawerShell>
  );
}
