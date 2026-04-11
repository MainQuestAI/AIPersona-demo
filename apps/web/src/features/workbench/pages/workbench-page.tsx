import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Info } from 'lucide-react';

import { buildStudyRoute } from '@/app/services/studyRuntimeViews';
import {
  fetchAgentMessages,
  postAgentReply,
  type AgentMessage,
  type WorkbenchProjection,
} from '@/app/services/studyRuntime';
import { useWorkbenchUiStore } from '@/app/store/ui-store';
import {
  buildExecutiveSummaryForProjection,
  buildPromptSuggestions,
  buildSetupBarData,
  buildStudySessionBoard,
  getPitchScenarioBundle,
} from '@/app/services/workbenchRuntimeBridge';
import { DrawerShell } from '@/features/evidence/components/drawer-shell';
import { InputSourcesDrawer } from '@/features/evidence/components/input-sources-drawer';
import { ReplayModal } from '@/features/evidence/components/replay-modal';
import { TrustDrawer } from '@/features/evidence/components/trust-drawer';
import { TwinProvenanceDrawer } from '@/features/evidence/components/twin-provenance-drawer';
import { ResultPanel } from '@/features/results/components/result-panel';
import { AgentConversation } from '../components/agent-conversation';
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

  const studyId = projection.study.id;
  const scenario = useMemo(() => getPitchScenarioBundle(projection), [projection]);
  const promptSuggestions = useMemo(() => buildPromptSuggestions(projection), [projection]);
  const setupBarData = useMemo(() => buildSetupBarData(projection), [projection]);
  const executiveSummary = useMemo(() => buildExecutiveSummaryForProjection(projection), [projection]);
  const sessionBoard = useMemo(() => buildStudySessionBoard(projection), [projection]);

  // --- Agent messages ---
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [sending, setSending] = useState(false);
  const lastIdRef = useRef<string | undefined>(undefined);

  // Initial load + polling
  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const { messages: newMsgs } = await fetchAgentMessages(studyId, lastIdRef.current);
        if (!active) return;
        if (newMsgs.length > 0) {
          setMessages((prev) => [...prev, ...newMsgs]);
          lastIdRef.current = newMsgs[newMsgs.length - 1].id;
        }
      } catch {
        // ignore polling errors
      }
    }

    void poll();
    const interval = setInterval(poll, 2500);
    return () => { active = false; clearInterval(interval); };
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

  async function handleAction(actionId: string, action: string) {
    // Handle frontend-only actions
    if (action === '查看计划详情') { setDetailsOpen(true); return; }
    if (action === '查看详细对比') { navigate(buildStudyRoute('/compare', studyId)); return; }
    if (action === '查看研究回放') { openReplay(); return; }
    if (action === '下载报告') {
      const hasReport = projection.artifacts?.some((a) => a.artifact_type === 'report' && a.status === 'ready');
      if (hasReport) {
        const base = (import.meta.env.VITE_STUDY_RUNTIME_API_URL || 'http://127.0.0.1:8000') as string;
        window.open(`${base}/studies/${encodeURIComponent(studyId)}/report`, '_blank');
      }
      return;
    }

    // Delegate to onCardAction for legacy actions
    onCardAction?.(action);

    // Send to agent
    setSending(true);
    try {
      await postAgentReply(studyId, { action_id: actionId, action });
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
    awaiting_midrun_approval: '待中途审核', succeeded: '已完成',
    failed: '执行异常', completed: '已完成',
  };
  const currentStatus = (rawStatus ? STATUS_LABELS[rawStatus] : undefined) ?? rawStatus ?? '未知';

  const progressSegments = sessionBoard.map((card) => ({
    id: card.id, label: card.label, status: card.status,
  }));

  return (
    <div className="flex h-full flex-col">
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
          <div className="mt-3 grid gap-2 inner-card p-4 text-xs text-muted sm:grid-cols-3 lg:grid-cols-6">
            <div><span className="text-tertiary">孪生：</span>{setupBarData.consumerTwinsLabel}</div>
            <div><span className="text-tertiary">构建自：</span>{setupBarData.builtFrom}</div>
            <div><span className="text-tertiary">标杆包：</span>{setupBarData.benchmarkPack}</div>
            <div><span className="text-tertiary">更新：</span>{setupBarData.lastUpdated}</div>
            <div><span className="text-tertiary">刺激物：</span>{scenario.studyPlanVersion.selectedStimuli.join(' / ')}</div>
            <div><span className="text-tertiary">版本：</span>{projection.latest_plan_version?.version_no ? `v${projection.latest_plan_version.version_no}` : '--'}</div>
          </div>
        ) : null}
      </div>

      {/* Three-panel body */}
      <div className="mt-3 flex flex-1 min-h-0 gap-5 overflow-hidden">
        {/* Center: Agent Conversation + Composer */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <AgentConversation
              messages={messages}
              sending={sending}
              onAction={handleAction}
            />
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
