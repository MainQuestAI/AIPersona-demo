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
import { translateStimulusType, translateStatus } from '../services/studyRuntimeViews';

type State =
  | { status: 'loading' }
  | { status: 'ready'; stimuli: StimulusRecord[]; jobs: IngestionJob[]; mappings: DatasetMapping[] }
  | { status: 'error'; message: string };

async function resolveOptional<T>(loader: Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    return fallback;
  }
}

export function StimulusLibraryPage() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [importing, setImporting] = useState(false);

  async function load(signal?: AbortSignal) {
    const stimuli = await listStimuli({ signal });
    const [jobs, mappings] = await Promise.all([
      resolveOptional(listIngestionJobs({ signal }), []),
      resolveOptional(listDatasetMappings({ signal }), []),
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

  function triggerFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv,.xlsx';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        await importAsset({
          asset_kind: 'stimulus_asset',
          name: file.name.replace(/\.[^.]+$/, ''),
          source_format: file.name.endsWith('.json') ? 'json' : file.name.endsWith('.csv') ? 'csv' : 'xlsx',
          storage_uri: `upload://${file.name}`,
          metadata: {
            stimulus_type: 'concept',
            description: `从文件 ${file.name} 导入。`,
            original_filename: file.name,
          },
        });
        await load();
      } finally {
        setImporting(false);
      }
    };
    input.click();
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
            <div className="eyebrow text-danger">刺激物库</div>
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
            <div className="eyebrow text-accent">刺激物库</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-text">
              刺激物资产管理
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              导入、查看和管理研究中使用的概念卡、包装设计等刺激物资产。
            </p>
          </div>
          <button type="button" onClick={triggerFileUpload} className="btn-accent" disabled={importing}>
            <Upload className="h-4 w-4" />
            {importing ? '正在导入...' : '导入概念资产'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-panel border border-line bg-panel p-5 shadow-panel">
          <div className="eyebrow text-muted">刺激物列表</div>
          <div className="mt-4 space-y-3">
            {state.stimuli.length === 0 ? (
              <div className="text-sm text-tertiary py-4 text-center">暂无刺激物资产</div>
            ) : null}
            {state.stimuli.map((stimulus) => (
              <div key={stimulus.id} className="inner-card px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-text">{stimulus.name}</div>
                  <div className="text-xs text-muted">{translateStimulusType(stimulus.stimulus_type)}</div>
                </div>
                <div className="mt-1 text-sm text-muted">{stimulus.description}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-panel border border-line bg-panel p-5 shadow-panel">
            <div className="eyebrow text-muted">导入任务</div>
            <div className="mt-4 space-y-3">
              {state.jobs.length === 0 ? (
                <div className="text-sm text-tertiary py-4 text-center">暂无导入任务</div>
              ) : null}
              {state.jobs.map((job) => (
                <div key={job.id} className="inner-card px-4 py-3 text-sm">
                  <div className="text-text">导入任务 #{job.id.slice(0, 8)}</div>
                  <div className="mt-0.5 text-muted">{translateStatus(job.status)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-panel border border-line bg-panel p-5 shadow-panel">
            <div className="eyebrow text-muted">数据映射</div>
            <div className="mt-4 space-y-3">
              {state.mappings.length === 0 ? (
                <div className="text-sm text-tertiary py-4 text-center">暂无数据映射</div>
              ) : null}
              {state.mappings.map((mapping) => (
                <div key={mapping.id} className="inner-card px-4 py-3 text-sm">
                  <div className="text-text">映射 #{mapping.id.slice(0, 8)}</div>
                  <div className="mt-0.5 text-muted">{translateStatus(mapping.mapping_status)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
