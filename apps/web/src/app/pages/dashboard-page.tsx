import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Loader2, Plus, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  createDemoStudy,
  listConsumerTwins,
  listIngestionJobs,
  listStimuli,
  listStudies,
  startAgent,
  type ConsumerTwinRecord,
  type IngestionJob,
  type StimulusRecord,
  type StudyListItem,
} from '../services/studyRuntime';
import { rememberLatestStudySession } from '../services/studySession';
import { buildStudyRoute, translateStatus } from '../services/studyRuntimeViews';
import { TwinSelectorModal } from '@/features/workbench/components/twin-selector-modal';

type State =
  | { status: 'loading' }
  | {
      status: 'ready';
      studies: StudyListItem[];
      twins: ConsumerTwinRecord[];
      stimuli: StimulusRecord[];
      jobs: IngestionJob[];
    }
  | { status: 'error'; message: string };

export function DashboardPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [creating, setCreating] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const [studies, twins, stimuli, jobs] = await Promise.all([
          listStudies({ signal: controller.signal }),
          listConsumerTwins({ signal: controller.signal }),
          listStimuli({ signal: controller.signal }),
          listIngestionJobs({ signal: controller.signal }),
        ]);
        setState({ status: 'ready', studies, twins, stimuli, jobs });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : '读取业务概览失败',
        });
      }
    })();
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
      });
      try { await startAgent(bundle.study.id); } catch { /* non-blocking */ }
      navigate(`/studies/${bundle.study.id}/workbench`);
    } finally {
      setCreating(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <section className="rounded-panel border border-line bg-panel p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-sm tracking-wide text-muted">正在加载业务概览</span>
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
            <div className="eyebrow text-danger">业务总览</div>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
          </div>
        </div>
      </section>
    );
  }

  const completedStudy = state.studies.find(
    (s) => s.current_run_status === 'succeeded' || s.status === 'completed',
  );
  const latestStudy = state.studies[0];
  const activeStudy = latestStudy && latestStudy !== completedStudy ? latestStudy : null;

  return (
    <div className="space-y-5">
      {/* Hero: Decision Launch Pad */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel p-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-text">
              你想了解什么？
            </h2>
            <p className="mt-2 text-sm text-muted">
              发起一个新的 AI 消费者调研，或继续之前的研究。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {latestStudy ? (
              <Link
                to={buildStudyRoute('/workbench', latestStudy.id)}
                className="btn-primary"
              >
                继续最近研究
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              disabled={creating}
              className="btn-secondary"
            >
              <Plus className="h-4 w-4" />
              {creating ? '正在创建...' : '新建研究'}
            </button>
          </div>
        </div>
      </motion.section>

      {/* Completed study result highlight */}
      {completedStudy ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-panel glass-panel--accent p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-accent/15 text-accent">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="eyebrow text-accent">推荐结论已就绪</div>
                <div className="mt-1.5 text-sm font-medium text-text">
                  {completedStudy.business_question ?? '已完成研究'}
                </div>
                <div className="mt-1 text-xs text-muted">
                  状态：{translateStatus(completedStudy.current_run_status ?? completedStudy.status)}
                  {completedStudy.latest_plan_version_no ? ` · 计划 v${completedStudy.latest_plan_version_no}` : ''}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={buildStudyRoute('/workbench', completedStudy.id)} className="btn-accent">
                查看结果
              </Link>
              <Link to={buildStudyRoute('/compare', completedStudy.id)} className="btn-chip">
                概念对比
              </Link>
            </div>
          </div>
        </motion.section>
      ) : null}

      {/* Active study (if different from completed) */}
      {activeStudy ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="inner-card p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="eyebrow text-muted">进行中的研究</div>
              <div className="mt-1.5 text-sm font-medium text-text">
                {activeStudy.business_question ?? '未命名研究'}
              </div>
              <div className="mt-1 text-xs text-muted">
                当前状态：{translateStatus(activeStudy.current_run_status ?? activeStudy.status)}
              </div>
            </div>
            <Link to={buildStudyRoute('/workbench', activeStudy.id)} className="btn-accent">
              进入工作台
            </Link>
          </div>
        </motion.section>
      ) : null}

      {/* Asset summary — compact row */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: '研究项目', value: state.studies.length, path: '/studies' },
          { label: '数字孪生', value: state.twins.length, path: '/consumer-twins' },
          { label: '刺激物', value: state.stimuli.length, path: '/stimulus-library' },
          { label: '导入任务', value: state.jobs.length, path: null },
        ].map((item) => {
          const content = (
            <>
              <div className="eyebrow text-tertiary">{item.label}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-text">{item.value}</div>
            </>
          );
          return item.path ? (
            <Link
              key={item.label}
              to={item.path}
              className="inner-card p-4 transition hover:border-accent/30"
            >
              {content}
            </Link>
          ) : (
            <div key={item.label} className="inner-card p-4">
              {content}
            </div>
          );
        })}
      </motion.section>

      <TwinSelectorModal
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onConfirm={(ids) => void handleCreateWithTwins(ids)}
      />
    </div>
  );
}
