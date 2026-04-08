import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Info } from 'lucide-react';

import { selectStudySetupBarData } from '@/mocks/selectors';
import { buildStudyRoute } from '@/app/services/studyRuntimeViews';
import { sendChatMessage, type WorkbenchProjection } from '@/app/services/studyRuntime';
import { useWorkbenchUiStore } from '@/app/store/ui-store';
import type { ConversationEvent } from '@/types/demo';
import {
  buildConversationEventsForProjection,
  buildExecutiveSummaryForProjection,
  buildPromptSuggestions,
  buildStudySessionBoard,
  getPitchScenarioBundle,
} from '@/app/services/workbenchRuntimeBridge';
import { InputSourcesDrawer } from '@/features/evidence/components/input-sources-drawer';
import { ReplayModal } from '@/features/evidence/components/replay-modal';
import { TrustDrawer } from '@/features/evidence/components/trust-drawer';
import { TwinProvenanceDrawer } from '@/features/evidence/components/twin-provenance-drawer';
import { ResultPanel } from '@/features/results/components/result-panel';
import { ConversationThread } from '../components/conversation-thread';
import { PromptComposer } from '../components/prompt-composer';

const PAUSE_EVENT_TYPES = new Set(['plan_approval_card', 'midrun_review_card']);
const PLAYBACK_STEP_DELAY = 1800;
const PLAYBACK_INITIAL_DELAY = 1200;

export function WorkbenchPage({
  projection,
  playback = false,
  onCardAction,
}: {
  projection: WorkbenchProjection;
  playback?: boolean;
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
  const messageIdRef = useRef(1000);

  const scenario = useMemo(() => getPitchScenarioBundle(projection), [projection]);
  const baseEvents = useMemo(
    () => buildConversationEventsForProjection(projection),
    [projection],
  );
  const promptSuggestions = useMemo(
    () => buildPromptSuggestions(projection),
    [projection],
  );
  const setupBarData = useMemo(
    () => selectStudySetupBarData(scenario),
    [scenario],
  );
  const executiveSummary = useMemo(
    () => buildExecutiveSummaryForProjection(projection),
    [projection],
  );
  const sessionBoard = useMemo(
    () => buildStudySessionBoard(projection),
    [projection],
  );

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (!focus) {
      return;
    }
    if (focus === 'trust') {
      openDrawer('trust');
    } else if (focus === 'inputs') {
      openDrawer('inputs');
    } else if (focus === 'twins') {
      openDrawer('twins');
    } else if (focus === 'replay') {
      openReplay();
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('focus');
      return next;
    }, { replace: true });
  }, [openDrawer, openReplay, searchParams, setSearchParams]);

  // --- Dynamic messages appended by user interaction ---
  const [extraEvents, setExtraEvents] = useState<ConversationEvent[]>([]);
  const allEvents = useMemo(
    () => [...baseEvents, ...extraEvents],
    [baseEvents, extraEvents],
  );

  // --- Playback state ---
  const [visibleCount, setVisibleCount] = useState(playback ? 0 : baseEvents.length);
  const [isPaused, setIsPaused] = useState(false);
  const isPlaybackActive = playback && visibleCount < baseEvents.length && !isPaused;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advancePlayback = useCallback(() => {
    setVisibleCount((prev) => {
      const next = prev + 1;
      const justShown = baseEvents[next - 1];
      if (justShown && PAUSE_EVENT_TYPES.has(justShown.type)) {
        setIsPaused(true);
      }
      return next;
    });
  }, [baseEvents]);

  useEffect(() => {
    if (!playback || isPaused || visibleCount >= baseEvents.length) return;
    const delay = visibleCount === 0 ? PLAYBACK_INITIAL_DELAY : PLAYBACK_STEP_DELAY;
    timerRef.current = setTimeout(advancePlayback, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playback, isPaused, visibleCount, baseEvents.length, advancePlayback]);

  // When not in playback or playback finishes, show all base events + extras
  useEffect(() => {
    if (!playback) {
      setVisibleCount(baseEvents.length + extraEvents.length);
    }
  }, [playback, baseEvents.length, extraEvents.length]);

  // When extra events are added (user sends message), bump visible count
  useEffect(() => {
    if (!playback || visibleCount >= baseEvents.length) {
      setVisibleCount(baseEvents.length + extraEvents.length);
    }
  }, [extraEvents.length, baseEvents.length, playback, visibleCount]);

  function handleCardAction(action: string) {
    if (isPaused) {
      setIsPaused(false);
      setTimeout(advancePlayback, 600);
    }
    if (action === '查看计划详情') {
      setDetailsOpen(true);
      return;
    }
    onCardAction?.(action);
  }

  function handleUserSend(message: string) {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentMsgId = ++messageIdRef.current;

    const userEvent: ConversationEvent = {
      id: `user-msg-${currentMsgId}`,
      type: 'user_message',
      body: message,
      timestamp: ts,
    };

    setExtraEvents((prev) => [...prev, userEvent]);

    // Call real chat API, fallback to mock on error
    const studyId = projection.study.id;
    sendChatMessage(studyId, message)
      .then((res) => {
        const agentEvent: ConversationEvent = {
          id: `agent-reply-${currentMsgId}`,
          type: 'agent_message',
          body: res.reply,
          timestamp: ts,
        };
        setExtraEvents((prev) => [...prev, agentEvent]);
      })
      .catch(() => {
        const agentEvent: ConversationEvent = {
          id: `agent-reply-${currentMsgId}`,
          type: 'agent_message',
          body: '抱歉，AI 服务暂时不可用。请确认后端服务已启动后重试。',
          timestamp: ts,
        };
        setExtraEvents((prev) => [...prev, agentEvent]);
      });
  }

  const rawStatus = projection.current_run?.status ?? projection.study.status;
  const STATUS_LABELS: Record<string, string> = {
    draft: '草稿',
    planning: '计划中',
    pending_approval: '待审批',
    approved: '已审批',
    queued: '排队中',
    running: '执行中',
    awaiting_midrun_approval: '待中途审核',
    succeeded: '已完成',
    failed: '执行异常',
    completed: '已完成',
  };
  const currentStatus = (rawStatus ? STATUS_LABELS[rawStatus] : undefined) ?? rawStatus ?? '未知';

  const progressSegments = sessionBoard.map((card) => ({
    id: card.id,
    label: card.label,
    status: card.status,
  }));

  return (
    <div className="flex h-full flex-col">
      {/* Compact Header Bar */}
      <div className="flex-none border-b border-line pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-[-0.02em] text-text">
              {scenario.meta.studyName}
            </h2>
            <span className="shrink-0 rounded-btn border border-accent/30 bg-accentSoft px-2 py-0.5 font-mono text-[0.6rem] font-semibold text-accent">
              {currentStatus}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 md:flex">
              {progressSegments.map((seg) => (
                <div key={seg.id} className="flex items-center gap-1.5">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      seg.status === 'done'
                        ? 'bg-accent shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                        : seg.status === 'current'
                          ? 'bg-action shadow-[0_0_6px_rgba(255,107,43,0.5)]'
                          : 'bg-surfaceElevated'
                    }`}
                  />
                  <span className={`text-[0.6rem] font-medium ${
                    seg.status === 'done' ? 'text-accent' : seg.status === 'current' ? 'text-text' : 'text-tertiary'
                  }`}>
                    {seg.label}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="btn-secondary !px-2.5 !py-1.5 !text-[0.65rem]"
            >
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
        {/* Center: Conversation + Composer */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <ConversationThread
              events={allEvents}
              visibleCount={visibleCount}
              isStreaming={isPlaybackActive}
              onCardAction={handleCardAction}
            />
          </div>
          <div className="flex-none pt-3">
            <PromptComposer suggestions={promptSuggestions} onSend={handleUserSend} />
          </div>
        </div>

        {/* Right: Results Panel */}
        <div className="hidden w-[380px] shrink-0 overflow-y-auto lg:block">
          <ResultPanel
            projection={projection}
            scenario={scenario}
            onOpenCompare={() => navigate(buildStudyRoute('/compare', projection.study.id))}
            onOpenReplay={() => openReplay()}
            onOpenTrust={() => openDrawer('trust')}
            onOpenTwins={() => navigate(buildStudyRoute('/twins', projection.study.id))}
            onOpenInputs={() => openDrawer('inputs')}
            onCardAction={handleCardAction}
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
    </div>
  );
}
