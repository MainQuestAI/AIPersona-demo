import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { listConsumerTwins, type ConsumerTwinRecord } from '../services/studyRuntime';

type State =
  | { status: 'loading' }
  | { status: 'ready'; twins: ConsumerTwinRecord[] }
  | { status: 'error'; message: string };

export function ConsumerTwinsPage() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    void listConsumerTwins({ signal: controller.signal })
      .then((twins) => setState({ status: 'ready', twins }))
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : '读取 Twin Center 失败',
        });
      });
    return () => controller.abort();
  }, []);

  if (state.status === 'loading') {
    return (
      <section className="rounded-panel border border-line bg-panel p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-sm tracking-wide text-muted">正在加载数字孪生</span>
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
            <div className="eyebrow text-danger">Consumer Twins</div>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-panel border border-line bg-panel p-6 shadow-panel">
        <div className="eyebrow text-accent">Consumer Twins</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-text">
          Twin Center 已正式进入产品导航
        </h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          当前页面读取的都是后端真实 Twin 对象。下一步继续加 lineage、version diff 和 calibration 后，这里就是正式的 Twin Center。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {state.twins.map((twin) => (
          <article key={twin.id} className="rounded-panel border border-line bg-panel p-5 shadow-panel">
            <div className="eyebrow text-muted">Twin Version</div>
            <div className="mt-2 text-lg font-semibold text-text">
              {String(twin.persona_profile_snapshot_json?.name ?? twin.target_audience_label ?? twin.id)}
            </div>
            <div className="mt-2 text-sm text-muted">
              目标人群：{twin.target_audience_label ?? '待补充'}
            </div>
            <div className="mt-1 text-sm text-muted">
              最新版本：{twin.latest_version_no ? `v${twin.latest_version_no}` : '待补充'}
            </div>
            <div className="mt-3 text-sm leading-6 text-muted">
              {twin.business_purpose ?? '该 Twin 用于支持研究执行。'}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
