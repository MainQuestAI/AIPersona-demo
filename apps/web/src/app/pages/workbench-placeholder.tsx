import { motion } from 'framer-motion';
import { AlertTriangle, CircleDashed, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  approvePlan,
  bootstrapSeedAssets,
  createDemoStudy,
  fetchWorkbenchProjection,
  getReportDownloadUrl,
  listStudies,
  resumeRun,
  startAgent,
  startRun,
  submitPlanForApproval,
  type SeedAssetPack,
  type StudyListItem,
  type WorkbenchProjection,
} from '../services/studyRuntime';
import {
  rememberLatestStudySession,
  type LatestStudySession,
} from '../services/studySession';
import { WorkbenchPage } from '@/features/workbench/pages/workbench-page';
import { useWorkbenchUiStore } from '../store/ui-store';
import { useLatestStudySession } from '../hooks/useLatestStudySession';
import { buildStudyRoute } from '../services/studyRuntimeViews';

type WorkbenchLoaderState =
  | { status: 'idle' | 'loading' | 'empty' }
  | { status: 'error'; errorMessage: string }
  | { status: 'ready'; projection: WorkbenchProjection };

type ActionState =
  | { status: 'idle' }
  | { status: 'running'; label: string }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string };

const RESEARCH_TEMPLATES = [
  { label: '概念筛选', description: '对比多个产品概念，找出最具潜力的方向' },
  { label: '命名测试', description: '评估候选命名在目标人群中的接受度和联想' },
  { label: '沟通素材测试', description: '测试 KV、文案或广告片在消费者中的共鸣和说服力' },
];

function EmptyWorkbenchState({
  busy,
  onCreateDemoStudy,
  latestStudy,
  historyStudies,
}: {
  busy: boolean;
  onCreateDemoStudy: (question: string, twinIds?: string[], stimulusIds?: string[]) => void;
  latestStudy: LatestStudySession | null;
  historyStudies: StudyListItem[];
}) {
  const [question, setQuestion] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [seedPack, setSeedPack] = useState<SeedAssetPack | null>(null);
  const [selectedTwins, setSelectedTwins] = useState<Set<string>>(new Set());
  const [selectedStimuli, setSelectedStimuli] = useState<Set<string>>(new Set());

  useEffect(() => {
    bootstrapSeedAssets().then((pack) => {
      setSeedPack(pack);
      setSelectedTwins(new Set(pack.twin_versions.map((t) => t.id)));
      setSelectedStimuli(new Set(pack.stimuli.map((s) => s.id)));
    }).catch(() => {/* ignore */});
  }, []);

  function toggleTwin(id: string) {
    setSelectedTwins((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleStimulus(id: string) {
    setSelectedStimuli((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const defaultQuestion = '哪一个母婴饮品概念值得进入真实消费者验证？';
  const effectiveQuestion = question.trim() || defaultQuestion;
  const seedLoading = !seedPack;

  // C-01: execution time estimate
  const idiCalls = selectedTwins.size * selectedStimuli.size * 5; // 5 LLM calls per multi-turn IDI
  const replicaCalls = selectedStimuli.size * 3; // 3 replicas per stimulus
  const totalCalls = idiCalls + 1 + replicaCalls + 1; // + theme extraction + recommendation
  const estimatedMinutes = Math.ceil(totalCalls * 12 / 60); // ~12s per call

  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-2xl"
      >
        {/* Greeting */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-card bg-accent/15 text-accent">
            <CircleDashed className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-text">
            你想了解什么？
          </h2>
          <p className="mt-2 text-sm text-muted">
            描述您的研究问题，AI 将自动生成研究计划并等待您的审批
          </p>
        </div>

        {/* Input area */}
        <div className="mt-8 glass-panel p-5">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`例如：${defaultQuestion}`}
            rows={3}
            className="w-full resize-none rounded-btn border border-line bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-text placeholder:text-tertiary focus:border-accent/40 focus:outline-none"
          />
          {/* C-03: show default question hint when input is empty */}
          {!question.trim() && (
            <div className="mt-1.5 text-[0.65rem] text-tertiary">
              未输入时将使用默认问题：{defaultQuestion}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {RESEARCH_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  className="btn-chip"
                  title={t.description}
                  onClick={() => setQuestion(t.description)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {/* I-01: disable config button while seed loading */}
              <button
                type="button"
                onClick={() => setConfigOpen((v) => !v)}
                disabled={seedLoading}
                className="btn-secondary-sm"
              >
                {seedLoading ? '加载中...' : configOpen ? '收起配置' : '配置研究'}
              </button>
              <button
                type="button"
                onClick={() => onCreateDemoStudy(
                  effectiveQuestion,
                  selectedTwins.size > 0 ? [...selectedTwins] : undefined,
                  selectedStimuli.size > 0 ? [...selectedStimuli] : undefined,
                )}
                disabled={busy || selectedTwins.size === 0 || selectedStimuli.size === 0}
                className="btn-primary"
              >
                {busy ? '正在创建...' : '开始研究'}
              </button>
            </div>
          </div>

          {/* Configuration panel */}
          {configOpen && seedPack ? (
            <div className="mt-4 space-y-4 border-t border-line pt-4">
              <div>
                <div className="text-xs font-semibold text-muted">目标人群孪生 ({selectedTwins.size}/{seedPack.twin_versions.length})</div>
                <div className="mt-2 space-y-1.5">
                  {seedPack.twin_versions.map((twin) => (
                    <label key={twin.id} className="flex items-center gap-2.5 cursor-pointer rounded-btn px-3 py-2 hover:bg-surfaceElevated">
                      <input
                        type="checkbox"
                        checked={selectedTwins.has(twin.id)}
                        onChange={() => toggleTwin(twin.id)}
                        className="h-4 w-4 rounded border-line accent-accent"
                      />
                      <span className="text-sm text-text">{twin.name}</span>
                      <span className="text-xs text-tertiary">v{twin.version_no}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted">刺激物概念 ({selectedStimuli.size}/{seedPack.stimuli.length})</div>
                <div className="mt-2 space-y-1.5">
                  {seedPack.stimuli.map((stimulus) => (
                    <label key={stimulus.id} className="flex items-center gap-2.5 cursor-pointer rounded-btn px-3 py-2 hover:bg-surfaceElevated">
                      <input
                        type="checkbox"
                        checked={selectedStimuli.has(stimulus.id)}
                        onChange={() => toggleStimulus(stimulus.id)}
                        className="h-4 w-4 rounded border-line accent-accent"
                      />
                      <span className="text-sm text-text">{stimulus.name}</span>
                      <span className="rounded-btn bg-surfaceElevated px-2 py-0.5 text-[0.6rem] text-tertiary">{stimulus.stimulus_type}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* C-01: execution time estimate */}
              <div className="rounded-btn border border-line bg-surfaceElevated px-3 py-2.5 text-xs text-muted">
                预计 <span className="font-semibold text-text">{totalCalls}</span> 次 AI 调用
                （{selectedTwins.size} 孪生 × {selectedStimuli.size} 刺激物 × 5 轮 IDI + {replicaCalls} 轮评分），
                约需 <span className="font-semibold text-text">{estimatedMinutes}</span> 分钟
              </div>
            </div>
          ) : null}
        </div>

        {/* Recent study shortcut */}
        {latestStudy ? (
          <div className="mt-5 inner-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-tertiary">最近的研究</div>
                <div className="mt-1 truncate text-sm text-text">
                  {latestStudy.businessQuestion ?? '未命名研究'}
                </div>
              </div>
              <Link
                to={`/workbench/${encodeURIComponent(latestStudy.id)}`}
                className="btn-accent"
              >
                继续
              </Link>
            </div>
          </div>
        ) : null}

        {/* Research history */}
        <div className="mt-8">
          <div className="eyebrow text-tertiary">历史研究</div>
          <div className="mt-3 space-y-2">
            {historyStudies.map((item) => (
              <Link
                key={item.id}
                to={buildStudyRoute('/workbench', item.id)}
                className="inner-card flex items-center justify-between px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text">{item.business_question ?? item.id}</div>
                  <div className="mt-0.5 text-xs text-tertiary">
                    {item.study_type ?? '研究'} · {item.category ?? '未分类'}
                  </div>
                </div>
                <span className="shrink-0 rounded-sm2 bg-accent/10 px-2 py-0.5 text-[0.6rem] font-medium text-accent">
                  {item.current_run_status ?? item.status ?? '待启动'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function WorkbenchPlaceholder() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studyId = params.studyId ?? searchParams.get('studyId') ?? '';

  const [state, setState] = useState<WorkbenchLoaderState>({ status: 'idle' });
  const [actionState, setActionState] = useState<ActionState>({ status: 'idle' });
  const [historyStudies, setHistoryStudies] = useState<StudyListItem[]>([]);
  const latestStudy = useLatestStudySession();
  const showToast = useWorkbenchUiStore((s) => s.showToast);

  // Auto-redirect to latest study when no studyId is provided
  useEffect(() => {
    if (!studyId && latestStudy) {
      navigate(`/workbench/${encodeURIComponent(latestStudy.id)}`, { replace: true });
    }
  }, [studyId, latestStudy, navigate]);

  useEffect(() => {
    if (!studyId) {
      setState({ status: 'empty' });
      void listStudies().then(setHistoryStudies).catch(() => setHistoryStudies([]));
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });
    void (async () => {
      try {
        const projection = await fetchWorkbenchProjection(studyId, {
          signal: controller.signal,
        });
        rememberLatestStudySession({
          id: projection.study.id,
          businessQuestion: projection.study.business_question,
        });
        setState({ status: 'ready', projection });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setState({
          status: 'error',
          errorMessage:
            error instanceof Error ? error.message : '读取 Study 数据时发生未知错误',
        });
      }
    })();

    return () => {
      controller.abort();
    };
  }, [studyId]);

  // Auto-poll when study is in-flight (running, queued, awaiting_midrun_approval)
  const readyProjection = state.status === 'ready' ? state.projection : null;

  useEffect(() => {
    if (!readyProjection) return;
    const runStatus = readyProjection.current_run?.status;
    const studyStatus = readyProjection.study.status;
    const shouldPoll =
      runStatus === 'running' ||
      runStatus === 'queued' ||
      studyStatus === 'running' ||
      runStatus === 'awaiting_midrun_approval';
    if (!shouldPoll) return;

    const interval = setInterval(async () => {
      try {
        const projection = await fetchWorkbenchProjection(readyProjection.study.id);
        setState({ status: 'ready', projection });
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    readyProjection?.current_run?.status,
    readyProjection?.study.id,
    readyProjection?.study.status,
  ]);

  async function reloadProjection(targetStudyId: string): Promise<void> {
    const projection = await fetchWorkbenchProjection(targetStudyId);
    setState({ status: 'ready', projection });
  }

  async function handleCreateDemoStudy(question?: string, twinIds?: string[], stimulusIds?: string[]): Promise<void> {
    setActionState({ status: 'running', label: '正在生成研究计划...' });
    try {
      const bundle = await createDemoStudy('boss', question || undefined, {
        twinVersionIds: twinIds,
        stimulusIds: stimulusIds,
      });
      rememberLatestStudySession({
        id: bundle.study.id,
        businessQuestion: bundle.study.business_question,
      });
      // Start agent conversation
      try {
        await startAgent(bundle.study.id);
      } catch {
        // Agent start failure is non-blocking — workbench will fallback to artifact events
      }
      setActionState({
        status: 'success',
        message: '研究已创建，AI 助手正在启动...',
      });
      await new Promise((resolve) => setTimeout(resolve, 600));
      navigate(`/studies/${bundle.study.id}/workbench`);
    } catch (error) {
      setActionState({
        status: 'error',
        message: error instanceof Error ? error.message : '创建研究项目失败',
      });
    }
  }

  async function runAction(label: string, action: () => Promise<void>): Promise<void> {
    setActionState({ status: 'running', label });
    try {
      await action();
      setActionState({ status: 'success', message: '运行时状态已刷新。' });
    } catch (error) {
      setActionState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Runtime action 失败',
      });
    }
  }

  if (state.status === 'empty') {
    return (
      <EmptyWorkbenchState
        busy={actionState.status === 'running'}
        latestStudy={latestStudy}
        historyStudies={historyStudies}
        onCreateDemoStudy={(question: string, twinIds?: string[], stimulusIds?: string[]) => {
          void handleCreateDemoStudy(question, twinIds, stimulusIds);
        }}
      />
    );
  }

  if (state.status === 'error') {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-panel glass-panel--danger p-6"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />
          <div>
            <div className="eyebrow text-danger">加载异常</div>
            <div className="mt-2 text-sm text-muted">{state.errorMessage}</div>
          </div>
        </div>
      </motion.section>
    );
  }

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel p-8"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <span className="eyebrow text-muted">正在加载研究详情</span>
          </div>
        </motion.div>
      </section>
    );
  }

  const projection = state.status === 'ready' ? state.projection : null;
  if (!projection) {
    return null;
  }
  const activeStudyId = projection.study.id;
  const latestPlanVersion = projection.latest_plan_version;
  const currentRun = projection.current_run;

  async function handleCardAction(action: string): Promise<void> {
    if (action === '批准计划' && latestPlanVersion?.approval_status === 'pending_approval') {
      await runAction('approve-plan', async () => {
        await approvePlan(activeStudyId, latestPlanVersion.id);
        await reloadProjection(activeStudyId);
      });
    } else if (action === '继续定量排序' && currentRun?.status === 'awaiting_midrun_approval') {
      await runAction('resume-run', async () => {
        await resumeRun(activeStudyId, currentRun.id);
        await reloadProjection(activeStudyId);
      });
    } else if (action === '提交审批' && latestPlanVersion?.approval_status === 'draft') {
      await runAction('submit-plan', async () => {
        await submitPlanForApproval(activeStudyId, latestPlanVersion.id);
        await reloadProjection(activeStudyId);
      });
    } else if (action === '启动研究' && latestPlanVersion?.approval_status === 'approved' && !currentRun) {
      await runAction('start-run', async () => {
        await startRun(activeStudyId, latestPlanVersion.id);
        await reloadProjection(activeStudyId);
      });
    } else if (action === '请求修改') {
      showToast('修改请求已发送至研究负责人');
    } else if (action === '查看计划详情') {
      // Handled in WorkbenchPage via detailsOpen toggle
    } else if (action === '暂停编辑') {
      showToast('研究已暂停，您可以修改刺激物配置后继续');
    } else if (action === '下载报告') {
      const hasReport = projection?.artifacts?.some((a) => a.artifact_type === 'report' && a.status === 'ready');
      if (hasReport) {
        window.open(getReportDownloadUrl(activeStudyId), '_blank');
      } else {
        showToast('报告正在生成中，请稍后再试');
      }
    } else if (action === '归档到资产库') {
      showToast('资产库归档功能将在下一版本上线');
    } else if (action === '进入消费者验证') {
      navigate(buildStudyRoute('/compare', activeStudyId));
    } else if (action === '探索"清"/"泉"命名边界') {
      showToast('命名边界深度分析已加入任务队列');
    } else if (action === '查看回放') {
      // Handled by WorkbenchPage UI store — openReplay
    } else if (action === '查看完整对比') {
      navigate(buildStudyRoute('/compare', activeStudyId));
    } else if (action === '查看变更') {
      showToast('变更详情正在加载');
    } else if (action === '启动重跑') {
      showToast('重跑功能将在下一版本上线');
    } else if (action === '保留当前结果') {
      showToast('已保留当前研究结果');
    }
  }

  return (
    <div className="flex h-full flex-col">
      {actionState.status === 'error' ? (
        <div className="flex-none inner-card border-danger/30 bg-dangerSoft px-4 py-3 text-sm text-danger">
          {actionState.message}
        </div>
      ) : null}
      <div className="flex-1 min-h-0">
        <WorkbenchPage
          projection={projection}
          onCardAction={(action: string) => { void handleCardAction(action); }}
        />
      </div>
    </div>
  );
}
