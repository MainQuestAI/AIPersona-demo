import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  listConsumerTwins,
  listIngestionJobs,
  listStimuli,
  listStudies,
  type ConsumerTwinRecord,
  type IngestionJob,
  type StimulusRecord,
  type StudyListItem,
} from '../services/studyRuntime';
import { buildStudyRoute } from '../services/studyRuntimeViews';

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
  const [state, setState] = useState<State>({ status: 'loading' });

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
            <div className="eyebrow text-danger">Dashboard</div>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
          </div>
        </div>
      </section>
    );
  }

  const latestStudy = state.studies[0];

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-panel border border-line bg-panel p-6 shadow-panel"
      >
        <div className="eyebrow text-accent">业务总览</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-text">
          欢迎回来
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
          这是你的 AI 消费者研究工作台。研究项目、数字孪生资产、刺激物和导入任务的实时概览。
        </p>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['研究项目', String(state.studies.length), '已创建'],
          ['数字孪生', String(state.twins.length), '可用版本'],
          ['刺激物', String(state.stimuli.length), '概念资产'],
          ['导入任务', String(state.jobs.length), '数据作业'],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-panel border border-line bg-panel p-5 shadow-panel">
            <div className="eyebrow text-muted">{label}</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-text">{value}</div>
            <div className="mt-1 text-sm text-muted">{detail}</div>
          </div>
        ))}
      </section>

      {latestStudy ? (
        <section className="rounded-panel border border-line bg-panel p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="eyebrow text-muted">最新研究</div>
              <div className="mt-2 text-lg font-semibold text-text">
                {latestStudy.business_question ?? latestStudy.id}
              </div>
              <div className="mt-1 text-sm text-muted">
                当前状态：{latestStudy.current_run_status ?? latestStudy.status ?? '待启动'}
              </div>
            </div>
            <Link to={buildStudyRoute('/workbench', latestStudy.id)} className="btn-accent">
              进入研究详情
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
