import { AlertTriangle, Loader2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  importAsset,
  listDatasetMappings,
  listIngestionJobs,
  listStimuli,
  type DatasetMapping,
  type IngestionJob,
  type StimulusRecord,
} from '../services/studyRuntime';

type State =
  | { status: 'loading' }
  | { status: 'ready'; stimuli: StimulusRecord[]; jobs: IngestionJob[]; mappings: DatasetMapping[] }
  | { status: 'error'; message: string };

export function StimulusLibraryPage() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [importing, setImporting] = useState(false);

  async function load(signal?: AbortSignal) {
    const [stimuli, jobs, mappings] = await Promise.all([
      listStimuli({ signal }),
      listIngestionJobs({ signal }),
      listDatasetMappings({ signal }),
    ]);
    setState({ status: 'ready', stimuli, jobs, mappings });
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '读取刺激物库失败',
      });
    });
    return () => controller.abort();
  }, []);

  async function handleImport() {
    setImporting(true);
    try {
      await importAsset({
        asset_kind: 'stimulus_asset',
        name: '新导入概念卡',
        source_format: 'json',
        storage_uri: 'file:///tmp/new-stimulus.json',
        metadata: {
          stimulus_type: 'concept',
          description: '用于演示导入链路的概念卡。',
        },
      });
      await load();
    } finally {
      setImporting(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <section className="rounded-panel border border-line bg-panel p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-sm tracking-wide text-muted">正在加载刺激物库</span>
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
            <div className="eyebrow text-danger">Stimulus Library</div>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-panel border border-line bg-panel p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="eyebrow text-accent">Stimulus Library</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-text">
              资产导入与 Stimulus 对象已接上真实 API
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              当前导入链路已经能创建 asset manifest、ingestion job 和 stimulus 对象。这里是 M1 的正式产品入口。
            </p>
          </div>
          <button type="button" onClick={() => void handleImport()} className="btn-accent" disabled={importing}>
            <Upload className="h-4 w-4" />
            {importing ? '正在导入...' : '导入概念资产'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-panel border border-line bg-panel p-5 shadow-panel">
          <div className="eyebrow text-muted">Stimuli</div>
          <div className="mt-4 space-y-3">
            {state.stimuli.map((stimulus) => (
              <div key={stimulus.id} className="inner-card px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-text">{stimulus.name}</div>
                  <div className="text-xs text-muted">{stimulus.stimulus_type}</div>
                </div>
                <div className="mt-1 text-sm text-muted">{stimulus.description}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-panel border border-line bg-panel p-5 shadow-panel">
            <div className="eyebrow text-muted">Ingestion Jobs</div>
            <div className="mt-4 space-y-3">
              {state.jobs.map((job) => (
                <div key={job.id} className="inner-card px-4 py-3 text-sm text-muted">
                  {job.id} · {job.status}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-panel border border-line bg-panel p-5 shadow-panel">
            <div className="eyebrow text-muted">Dataset Mappings</div>
            <div className="mt-4 space-y-3">
              {state.mappings.map((mapping) => (
                <div key={mapping.id} className="inner-card px-4 py-3 text-sm text-muted">
                  {mapping.id} · {mapping.mapping_status}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
