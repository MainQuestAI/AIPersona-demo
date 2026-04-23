import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Info, Loader2 } from 'lucide-react';

import { buildStudyRoute } from '@/app/services/studyRuntimeViews';
import { openStudyReportWindow } from '@/app/services/reportWindow';
import {
  fetchAgentMessages,
  listStudyMemories,
  postAgentReply,
  type AgentMessage,
  type StudyMemoryRecord,
  type WorkbenchProjection,
} from '@/app/services/studyRuntime';
import { useWorkbenchUiStore } from '@/app/store/ui-store';
import {
  buildConversationEventsForProjection,
  buildExecutiveSummaryForProjection,
  buildPromptSuggestions,
  buildSetupBarData,
  buildStudySessionBoard,
  getPitchScenarioBundle,
} from '@/app/services/workbenchRuntimeBridge';
import { TwinSelectorModal } from '@/features/workbench/components/twin-selector-modal';
import { DrawerShell } from '@/features/evidence/components/drawer-shell';
import { InputSourcesDrawer } from '@/features/evidence/components/input-sources-drawer';
import { ReplayModal } from '@/features/evidence/components/replay-modal';
import { TrustDrawer } from '@/features/evidence/components/trust-drawer';
import { TwinProvenanceDrawer } from '@/features/evidence/components/twin-provenance-drawer';
import { ResultPanel } from '@/features/results/components/result-panel';
import { AgentConversation } from '../components/agent-conversation';
import { ConversationThread } from '../components/conversation-thread';
import { PromptComposer } from '../components/prompt-composer';

export function WorkbenchPage({
  projection,
  onCardAction,
}: {
  projection: WorkbenchProjection;
  onCardAction?: (action: string) => void;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeDrawer = useWorkbenchUiStore((state) => state.activeDrawer);
  const replayOpen = useWorkbenchUiStore((state) => state.replayOpen);
  const openDrawer = useWorkbenchUiStore((state) => state.openDrawer);
  const closeDrawer = useWorkbenchUiStore((state) => state.closeDrawer);
  const openReplay = useWorkbenchUiStore((state) => state.openReplay);
  const closeReplay = useWorkbenchUiStore((state) => state.closeReplay);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resultDrawerOpen, setResultDrawerOpen] = useState(false);
  const [memories, setMemories] = useState<StudyMemoryRecord[]>([]);
  const [twinSelectorOpen, setTwinSelectorOpen] = useState(false);

  const studyId = projection.study.id;
  const scenario = useMemo(() => getPitchScenarioBundle(projection), [projection]);
  const fallbackEvents = useMemo(() => buildConversationEventsForProjection(projection), [projection]);
  const promptSuggestions = useMemo(() => buildPromptSuggestions(projection), [projection]);
  const setupBarData = useMemo(() => buildSetupBarData(projection), [projection]);
  const executiveSummary = useMemo(() => buildExecutiveSummaryForProjection(projection), [projection]);
  const sessionBoard = useMemo(() => buildStudySessionBoard(projection), [projection]);

  // --- Agent messages ---
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [messageLoadError, setMessageLoadError] = useState<string | null>(null);
  const lastIdRef = useRef<string | undefined>(undefined);

  // Initial load + polling with exponential backoff
  useEffect(() => {
    let active = true;
    let consecutiveErrors = 0;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    setMessages([]);
    setMessageLoadError(null);
    lastIdRef.current = undefined;

    const BASE_INTERVAL = 2500;
    const MAX_INTERVAL = 30_000;

    async function poll() {
      try {
        const { messages: newMsgs } = await fetchAgentMessages(studyId, lastIdRef.current);
        if (!active) return;
        consecutiveErrors = 0;
        setMessageLoadError(null);
        if (newMsgs.length > 0) {
          setMessages((prev) => [...prev, ...newMsgs]);
          lastIdRef.current = newMsgs[newMsgs.length - 1].id;
        }
      } catch (error) {
        if (!active) return;
        consecutiveErrors += 1;
        setMessageLoadError(
          error instanceof Error ? error.message : '研究会话加载失败，请稍后重试。',
        );
      }
      if (active) {
        const delay = Math.min(BASE_INTERVAL * 2 ** consecutiveErrors, MAX_INTERVAL);
        timerId = setTimeout(poll, delay);
      }
    }

    void poll();
    return () => { active = false; clearTimeout(timerId); };
  }, [studyId]);

  // Load study memories
  useEffect(() => {
    let active = true;
    void listStudyMemories(studyId).then((data) => {
      if (active) setMemories(data);
    }).catch(() => { /* ignore */ });
    return () => { active = false; };
  }, [studyId]);

  // Handle focus search params (trust/inputs/twins/replay drawers)
  useEffect(() => {
    const focus = searchParams.get('focus');
    if (!focus) return;
    if (focus === 'trust') openDrawer('trust');
    else if (focus === 'inputs') openDrawer('inputs');
    else if (focus === 'twins') openDrawer('twins');
    else if (focus === 'replay') openReplay();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('focus');
      return next;
    }, { replace: true });
  }, [openDrawer, openReplay, searchParams, setSearchParams]);

  // --- Handlers ---

  async function handleAction(actionId: string, action: string, actionLabel?: string) {
    // Handle frontend-only actions
    if (action === 'show_plan_details') { setDetailsOpen(true); return; }
    if (action === 'open_compare') { navigate(buildStudyRoute('/compare', studyId)); return; }
    if (action === 'open_replay') { openReplay(); return; }
    if (action === 'edit_plan') { setTwinSelectorOpen(true); return; }
    if (action === 'open_report') {
      const hasReport = projection.artifacts?.some((a) => a.artifact_type === 'report' && a.status === 'ready');
      if (hasReport) {
        await openStudyReportWindow(studyId);
      }
      return;
    }

    // Delegate to onCardAction for legacy actions
    onCardAction?.(actionLabel ?? action);

    // Send to agent
    setSending(true);
    try {
      await postAgentReply(studyId, { action_id: actionId, action, action_label: actionLabel });
    } finally {
      setSending(false);
    }
  }

  async function handleUserSend(message: string) {
    // Optimistically add user message
    const tempId = `temp-${Date.now()}`;
    const tempMsg: AgentMessage = {
      id: tempId,
      study_id: studyId,
      role: 'user',
      content: message,
      message_type: 'text',
      metadata_json: {},
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    setSending(true);
    try {
      await postAgentReply(studyId, { action: message });
    } finally {
      setSending(false);
    }
  }

  const rawStatus = projection.current_run?.status ?? projection.study.status;
  const STATUS_LABELS: Record<string, string> = {
    draft: '草稿', planning: '计划中', pending_approval: '待审批',
    approved: '已审批', queued: '排队中', running: '执行中',
    awaiting_midrun_approval: '待中途审核', paused_for_adjustment: '待调整', succeeded: '已完成',
    failed: '执行异常', completed: '已完成',
  };
  const currentStatus = (rawStatus ? STATUS_LABELS[rawStatus] : undefined) ?? rawStatus ?? '未知';

  // Determine whether the study is in an active execution phase.
  // When active + no agent messages yet, we must NOT show the ConversationThread fallback
  // (which contains a plan_approval_card) — that would contradict the right ResultPanel's state.
  const runStatus = projection.current_run?.status;
  const isActiveStudy =
    runStatus === 'running' ||
    runStatus === 'queued' ||
    runStatus === 'awaiting_midrun_approval' ||
    runStatus === 'paused_for_adjustment' ||
    runStatus === 'succeeded' ||
    projection.study.status === 'completed' ||
    projection.study.status === 'running';

  const progressSegments = sessionBoard.map((card) => ({
    id: card.id, label: card.label, status: card.status,
  }));

  return (
    <div className="flex h-full min-h-full flex-col">
      {/* Compact Header Bar */}
      <div className="flex-none border-b border-line pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-[-0.02em] text-text">
              {projection.study.business_question || scenario.meta.studyName}
            </h2>
            <span className="shrink-0 rounded-btn border border-accent/30 bg-accentSoft px-2 py-0.5 font-mono text-[0.6rem] font-semibold text-accent">
              {currentStatus}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 md:flex">
              {progressSegments.map((seg) => (
                <div key={seg.id} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${
                    seg.status === 'done' ? 'bg-accent shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                    : seg.status === 'current' ? 'bg-action shadow-[0_0_6px_rgba(255,107,43,0.5)]'
                    : 'bg-surfaceElevated'
                  }`} />
                  <span className={`text-[0.6rem] font-medium ${
                    seg.status === 'done' ? 'text-accent' : seg.status === 'current' ? 'text-text' : 'text-tertiary'
                  }`}>{seg.label}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDetailsOpen((v) => !v)} className="btn-secondary-sm">
              <Info className="h-3.5 w-3.5" />
              研究详情
              <ChevronDown className={`h-3 w-3 transition ${detailsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-sm text-muted">{executiveSummary.detail}</p>
        {detailsOpen ? (
          <div className="mt-3 space-y-3">
            <div className="grid gap-2 inner-card p-4 text-xs text-muted sm:grid-cols-3 lg:grid-cols-6">
              <div><span className="text-tertiary">孪生：</span>{setupBarData.consumerTwinsLabel}</div>
              <div><span className="text-tertiary">构建自：</span>{setupBarData.builtFrom}</div>
              <div><span className="text-tertiary">标杆包：</span>{setupBarData.benchmarkPack}</div>
              <div><span className="text-tertiary">更新：</span>{setupBarData.lastUpdated}</div>
              <div><span className="text-tertiary">刺激物：</span>{scenario.studyPlanVersion.selectedStimuli.join(' / ')}</div>
              <div><span className="text-tertiary">版本：</span>{projection.latest_plan_version?.version_no ? `v${projection.latest_plan_version.version_no}` : '--'}</div>
            </div>
            {projection.approval_gates && projection.approval_gates.length > 0 ? (
              <div className="inner-card p-4">
                <div className="eyebrow text-accent mb-2">审批链</div>
                <div className="space-y-2">
                  {projection.approval_gates.map((gate) => {
                    const GATE_LABELS: Record<string, string> = {
                      plan: '计划审批', midrun: '中途审核', artifact: '产物审批', rerun: '重跑审批',
                    };
                    const STATUS_LABELS: Record<string, string> = {
                      requested: '待审批', approved: '已通过', rejected: '已驳回', bypassed: '已跳过',
                    };
                    const STATUS_COLORS: Record<string, string> = {
                      requested: 'text-warning', approved: 'text-accent', rejected: 'text-danger', bypassed: 'text-muted',
                    };
                    const label = GATE_LABELS[gate.approval_type ?? ''] ?? gate.approval_type ?? '审批';
                    const statusLabel = STATUS_LABELS[gate.status ?? ''] ?? gate.status ?? '未知';
                    const statusColor = STATUS_COLORS[gate.status ?? ''] ?? 'text-muted';
                    const time = gate.updated_at ? new Date(gate.updated_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                    return (
                      <div key={gate.id} className="flex items-center gap-3 text-xs">
                        <div className={`h-2 w-2 rounded-full ${gate.status === 'approved' ? 'bg-accent' : gate.status === 'requested' ? 'bg-warning' : 'bg-surfaceElevated'}`} />
                        <span className="font-medium text-text">{label}</span>
                        <span className={statusColor}>{statusLabel}</span>
                        {gate.approved_by ? <span className="text-tertiary">by {gate.approved_by}</span> : null}
                        {gate.decision_comment ? <span className="text-muted truncate max-w-[200px]">{gate.decision_comment}</span> : null}
                        {time ? <span className="ml-auto text-tertiary">{time}</span> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {memories.length > 0 ? (
              <div className="inner-card p-4">
                <div className="eyebrow text-accent mb-2">研究记忆（{memories.length}）</div>
                <div className="space-y-1.5">
                  {memories.map((m) => {
                    const TYPE_LABELS: Record<string, string> = {
                      theme: '主题', insight: '洞察', segment_finding: '发现',
                      brand_positioning: '定位', preference: '偏好',
                    };
                    return (
                      <div key={m.id} className="flex items-start gap-2 text-xs">
                        <span className="shrink-0 rounded-btn bg-accent/10 px-1.5 py-0.5 text-[0.55rem] font-medium text-accent">
                          {TYPE_LABELS[m.memory_type] ?? m.memory_type}
                        </span>
                        <span className="text-muted">{m.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Three-panel body */}
      <div className="mt-3 flex flex-1 min-h-0 gap-5 overflow-hidden">
        {/* Center: Agent Conversation + Composer */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {messages.length > 0 ? (
              <AgentConversation
                messages={messages}
                sending={sending}
                onAction={handleAction}
              />
            ) : messageLoadError ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="glass-panel glass-panel--danger max-w-sm p-6">
                  <div className="eyebrow mb-2 text-danger">会话加载失败</div>
                  <p className="text-sm text-muted">
                    {messageLoadError}
                  </p>
                </div>
              </div>
            ) : isActiveStudy ? (
              // Study is running/completed but no agent messages yet.
              // Show a status-consistent placeholder — do NOT render ConversationThread
              // here, which would show stale plan_approval_card and contradict ResultPanel.
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                {runStatus === 'succeeded' || projection.study.status === 'completed' ? (
                  <div className="glass-panel p-6 max-w-sm">
                    <div className="eyebrow text-accent mb-2">研究已完成</div>
                    <p className="text-sm text-muted">
                      推荐结论已在右侧结果面板。你可以在下方继续追问研究助手。
                    </p>
                  </div>
                ) : (
                  <div className="glass-panel p-6 max-w-sm">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      <div className="eyebrow text-accent">研究执行中</div>
                    </div>
                    <p className="text-sm text-muted">
                      AI 研究助手正在运行，执行进度将在这里实时更新。
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <ConversationThread
                events={fallbackEvents}
                onCardAction={(action) => onCardAction?.(action)}
              />
            )}
          </div>
          <div className="flex-none pt-3">
            <div className="mb-2 lg:hidden">
              <button type="button" onClick={() => setResultDrawerOpen(true)} className="btn-accent w-full text-center">
                查看研究结果
              </button>
            </div>
            <PromptComposer suggestions={promptSuggestions} onSend={handleUserSend} />
          </div>
        </div>

        {/* Right: Results Panel */}
        <div className="hidden w-[380px] shrink-0 overflow-y-auto lg:block">
          <ResultPanel
            projection={projection}
            scenario={scenario}
            onOpenCompare={() => navigate(buildStudyRoute('/compare', studyId))}
            onOpenReplay={() => openReplay()}
            onOpenTrust={() => openDrawer('trust')}
            onOpenTwins={() => navigate(buildStudyRoute('/twins', studyId))}
            onOpenInputs={() => openDrawer('inputs')}
            onCardAction={(action) => onCardAction?.(action)}
          />
        </div>
      </div>

      {/* Drawers & Modals */}
      <TrustDrawer open={activeDrawer === 'trust'} trustPanel={scenario.trustPanel} onClose={closeDrawer} />
      <TwinProvenanceDrawer open={activeDrawer === 'twins'} twins={scenario.twinCatalog} onClose={closeDrawer} />
      <InputSourcesDrawer
        open={activeDrawer === 'inputs'}
        inputsSnapshot={scenario.inputsSnapshot}
        selectedStimuli={scenario.studyPlanVersion.selectedStimuli}
        libraryRecords={scenario.libraryRecords}
        onClose={closeDrawer}
      />
      <ReplayModal open={replayOpen} replay={scenario.replay} onClose={closeReplay} />
      <TwinSelectorModal
        open={twinSelectorOpen}
        onClose={() => setTwinSelectorOpen(false)}
        onConfirm={async (ids) => {
          setTwinSelectorOpen(false);
          setSending(true);
          try {
            await postAgentReply(studyId, {
              action_id: 'edit_plan',
              action: JSON.stringify({ twin_version_ids: ids }),
              action_label: '调整配置',
            });
          } finally {
            setSending(false);
          }
        }}
      />
      <DrawerShell open={resultDrawerOpen} onClose={() => setResultDrawerOpen(false)} ariaLabel="研究结果">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="eyebrow text-muted">研究结果</div>
          <button type="button" onClick={() => setResultDrawerOpen(false)} className="btn-secondary">关闭</button>
        </div>
        <ResultPanel
          projection={projection}
          scenario={scenario}
          onOpenCompare={() => { setResultDrawerOpen(false); navigate(buildStudyRoute('/compare', studyId)); }}
          onOpenReplay={() => { setResultDrawerOpen(false); openReplay(); }}
          onOpenTrust={() => { setResultDrawerOpen(false); openDrawer('trust'); }}
          onOpenTwins={() => { setResultDrawerOpen(false); navigate(buildStudyRoute('/twins', studyId)); }}
          onOpenInputs={() => { setResultDrawerOpen(false); openDrawer('inputs'); }}
          onCardAction={(action) => onCardAction?.(action)}
        />
      </DrawerShell>
    </div>
  );
}
