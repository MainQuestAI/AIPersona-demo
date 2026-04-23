import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  createDemoStudy,
  getOfflineStudiesSnapshot,
  listStudies,
  startAgent,
  type StudyListItem,
} from '../services/studyRuntime';
import { buildStudyRoute, translateStatus } from '../services/studyRuntimeViews';
import { rememberLatestStudySession } from '../services/studySession';
import { TwinSelectorModal } from '@/features/workbench/components/twin-selector-modal';

type State =
  | { status: 'loading' }
  | { status: 'ready'; studies: StudyListItem[] }
  | { status: 'error'; message: string };

export function StudiesPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [creating, setCreating] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  async function load(signal?: AbortSignal): Promise<StudyListItem[]> {
    return Promise.race([
      listStudies({ signal }),
      new Promise<StudyListItem[]>((resolve) => {
        setTimeout(() => resolve(getOfflineStudiesSnapshot()), 8_500);
      }),
    ]);
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '读取研究列表失败',
      });
    }).then((studies) => {
      if (!studies) return;
      setState({ status: 'ready', studies });
    });
    return () => controller.abort();
  }, []);

  async function handleCreateWithTwins(twinVersionIds: string[]) {
    setSelectorOpen(false);
    setCreating(true);
    try {
      const bundle = await createDemoStudy(undefined, undefined, { twinVersionIds });
      rememberLatestStudySession({
        id: bundle.study.id,
        businessQuestion: bundle.study.business_question,
        status: bundle.study.status,
      });
      try { await startAgent(bundle.study.id); } catch { /* non-blocking */ }
      navigate(buildStudyRoute('/workbench', bundle.study.id));
    } finally {
      setCreating(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <section className="rounded-panel border border-line bg-panel p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-sm tracking-wide text-muted">正在加载研究列表</span>
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
            <div className="eyebrow text-danger">研究项目</div>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
          </div>
        </div>
      </section>
    );
  }

  const completedStudies = state.studies.filter(
    (s) => s.status === 'completed' || s.current_run_status === 'succeeded',
  );
  const activeStudies = state.studies.filter(
    (s) =>
      s.current_run_status === 'running' ||
      s.current_run_status === 'queued' ||
      s.current_run_status === 'awaiting_midrun_approval',
  );
  const draftStudies = state.studies.filter(
    (s) => !completedStudies.includes(s) && !activeStudies.includes(s),
  );

  function StudyCard({ study }: { study: StudyListItem }) {
    return (
      <Link
        to={buildStudyRoute('/workbench', study.id)}
        className="rounded-panel border border-line bg-panel p-5 shadow-panel transition hover:border-accent/35"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-text">
              {study.business_question ?? '未命名研究'}
            </div>
            <div className="mt-1.5 text-sm text-muted">
              {translateStatus(study.current_run_status ?? study.status)}
            </div>
          </div>
          <div className="rounded-btn border border-accent/30 bg-accentSoft px-3 py-1 text-[0.7rem] font-semibold text-accent">
            {study.latest_plan_version_no ? `计划 v${study.latest_plan_version_no}` : '计划未生成'}
          </div>
        </div>
      </Link>
    );
  }

  function StudyGroup({
    label,
    studies,
    delay,
  }: {
    label: string;
    studies: StudyListItem[];
    delay: number;
  }) {
    if (studies.length === 0) return null;
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        className="space-y-3"
      >
        <div className="eyebrow text-muted">{label}</div>
        <div className="grid gap-3">
          {studies.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      </motion.section>
    );
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-panel border border-line bg-panel p-6 shadow-panel"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="eyebrow text-accent">研究项目</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-text">
              全部研究
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
              创建、浏览并进入 AI 消费者研究。每个研究项目都有完整的执行轨迹和产出物。
            </p>
          </div>
          <button type="button" onClick={() => setSelectorOpen(true)} className="btn-accent" disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? '正在创建...' : '新建研究'}
          </button>
        </div>
      </motion.section>

      {state.studies.length === 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-panel border border-line bg-panel p-10 text-center shadow-panel"
        >
          <p className="text-sm text-muted">还没有研究项目，点击"新建研究"开始第一个 AI 消费者调研。</p>
        </motion.section>
      ) : (
        <div className="space-y-8">
          <StudyGroup label="已完成" studies={completedStudies} delay={0.1} />
          <StudyGroup label="执行中" studies={activeStudies} delay={0.15} />
          <StudyGroup label="草稿" studies={draftStudies} delay={0.2} />
        </div>
      )}

      <TwinSelectorModal
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onConfirm={(ids) => void handleCreateWithTwins(ids)}
      />
    </div>
  );
}
