import type { TrustPanelData } from '@/types/demo';
import { DrawerShell } from './drawer-shell';

export function TrustDrawer({
  open,
  trustPanel,
  onClose,
}: {
  open: boolean;
  trustPanel: TrustPanelData;
  onClose: () => void;
}) {
  return (
    <DrawerShell open={open} onClose={onClose} ariaLabel="可信度面板">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="eyebrow text-muted">可信度面板</div>
            <div className="mt-2 text-2xl font-semibold text-text">
              置信度 {trustPanel.confidenceLabel}
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary">关闭</button>
        </div>
        <div className="mt-6 space-y-4">
          <div className="inner-card p-4">
            <div className="eyebrow text-muted">基准测试包</div>
            <div className="mt-2 text-sm text-text">{trustPanel.benchmarkPack}</div>
          </div>
          {trustPanel.costNote ? (
            <div className="inner-card p-4">
              <div className="eyebrow text-muted">成本状态</div>
              <div className="mt-2 text-sm text-text">{trustPanel.costNote}</div>
            </div>
          ) : null}
          <div className="inner-card p-4">
            <div className="eyebrow text-muted">上次校准</div>
            <div className="mt-2 text-sm text-text">{trustPanel.lastCalibration}</div>
          </div>
          {trustPanel.methodology?.length ? (
            <div className="inner-card p-4">
              <div className="eyebrow text-muted">方法说明</div>
              <div className="mt-3 space-y-2 text-sm text-text">
                {trustPanel.methodology.map((item) => (
                  <div key={item} className="inner-card px-4 py-3">{item}</div>
                ))}
              </div>
            </div>
          ) : null}
          {trustPanel.evidenceCoverage?.length ? (
            <div className="inner-card p-4">
              <div className="eyebrow text-muted">证据覆盖</div>
              <div className="mt-3 space-y-2 text-sm text-text">
                {trustPanel.evidenceCoverage.map((item) => (
                  <div key={item} className="inner-card px-4 py-3">{item}</div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="inner-card p-4">
            <div className="eyebrow text-muted">审批记录</div>
            <div className="mt-3 space-y-2 text-sm text-text">
              {trustPanel.approvalTrail.map((item, i) => (
                <div key={i} className="inner-card px-4 py-3">{item}</div>
              ))}
            </div>
          </div>
          {trustPanel.recommendedAction ? (
            <div className="inner-card p-4">
              <div className="eyebrow text-muted">业务建议</div>
              <div className="mt-2 text-sm text-text">{trustPanel.recommendedAction}</div>
            </div>
          ) : null}
        </div>
    </DrawerShell>
  );
}
