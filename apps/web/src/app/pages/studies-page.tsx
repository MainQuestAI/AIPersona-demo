import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  createDemoStudy,
  listStudies,
  type StudyListItem,
} from '../services/studyRuntime';
import { buildStudyRoute } from '../services/studyRuntimeViews';
import { rememberLatestStudySession } from '../services/studySession';

type State =
  | { status: 'loading' }
  | { status: 'ready'; studies: StudyListItem[] }
  | { status: 'error'; message: string };

export function StudiesPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [creating, setCreating] = useState(false);

  async function load(signal?: AbortSignal) {
    const studies = await listStudies({ signal });
    setState({ status: 'ready', studies });
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
    });
    return () => controller.abort();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const bundle = await createDemoStudy();
      rememberLatestStudySession({
        id: bundle.study.id,
        businessQuestion: bundle.study.business_question,
      });
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
            <div className="eyebrow text-danger">Studies</div>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
          </div>
        </div>
      </section>
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
              研究项目
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
              创建、浏览并进入 AI 消费者研究。每个研究项目都有完整的执行轨迹和产出物。
            </p>
          </div>
          <button type="button" onClick={() => void handleCreate()} className="btn-accent" disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? '正在创建...' : '创建 Demo Study'}
          </button>
        </div>
      </motion.section>

      <section className="grid gap-4">
        {state.studies.map((study) => (
          <Link
            key={study.id}
            to={buildStudyRoute('/workbench', study.id)}
            className="rounded-panel border border-line bg-panel p-5 shadow-panel transition hover:border-accent/35"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-text">
                  {study.business_question ?? '未命名研究'}
                </div>
                <div className="mt-2 text-sm text-muted">
                  当前状态：{study.current_run_status ?? study.status ?? '待启动'}
                </div>
              </div>
              <div className="rounded-btn border border-accent/30 bg-accentSoft px-3 py-1 text-[0.7rem] font-semibold text-accent">
                {study.latest_plan_version_no ? `计划 v${study.latest_plan_version_no}` : '计划未生成'}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
