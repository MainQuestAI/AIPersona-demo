import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  listBenchmarkPacks,
  listCalibrationRuns,
  listConfidenceSnapshots,
  listDriftAlerts,
} from '../services/studyRuntime';

type State =
  | { status: 'loading' }
  | {
      status: 'ready';
      benchmarkPacks: unknown[];
      calibrationRuns: unknown[];
      confidenceSnapshots: unknown[];
      driftAlerts: unknown[];
    }
  | { status: 'error'; message: string };

export function CalibrationCenterPage() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const [benchmarkPacks, calibrationRuns, confidenceSnapshots, driftAlerts] = await Promise.all([
          listBenchmarkPacks({ signal: controller.signal }),
          listCalibrationRuns({ signal: controller.signal }),
          listConfidenceSnapshots({ signal: controller.signal }),
          listDriftAlerts({ signal: controller.signal }),
        ]);
        setState({
          status: 'ready',
          benchmarkPacks,
          calibrationRuns,
          confidenceSnapshots,
          driftAlerts,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : '读取校准中心失败',
        });
      }
    })();
    return () => controller.abort();
  }, []);

  if (state.status === 'loading') {
    return (
      <section className="rounded-panel border border-line bg-panel p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-sm tracking-wide text-muted">正在加载校准中心</span>
        </div>
      </section>
    );
  }

  if (state.status === 'error') {
    return (
      <section className="rounded-panel border border-danger/40 bg-panel p-6 shadow-panel">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />
          <div>
            <div className="eyebrow text-danger">校准中心</div>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-panel border border-line bg-panel p-6 shadow-panel">
        <div className="eyebrow text-accent">校准中心</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-text">
          校准中心
        </h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          基准包管理、校准运行、置信度快照和漂移预警。此功能即将在下一版本上线。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['基准包', state.benchmarkPacks.length],
          ['校准运行', state.calibrationRuns.length],
          ['置信度快照', state.confidenceSnapshots.length],
          ['漂移预警', state.driftAlerts.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-panel border border-line bg-panel p-5 shadow-panel">
            <div className="eyebrow text-muted">{label}</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-text">{String(value)}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
