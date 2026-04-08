import { useEffect, useRef } from 'react';
import { Bot, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ConversationEvent } from '@/types/demo';

import { MidrunReviewCard } from './cards/midrun-review-card';
import { PlanApprovalCard } from './cards/plan-approval-card';
import { QualSessionCard } from './cards/qual-session-card';
import { RecommendationCard } from './cards/recommendation-card';
import { RerunSuggestionCard } from './cards/rerun-suggestion-card';
import { StudyCompleteCard } from './cards/study-complete-card';

function AgentMessageCard({
  title,
  body,
}: {
  title?: string;
  body: string;
}) {
  return (
    <div className="glass-panel p-4">
      {title ? (
        <div className="text-base font-semibold tracking-[-0.01em] text-text">{title}</div>
      ) : null}
      <div className={title ? 'mt-1.5 text-sm leading-6 text-muted' : 'text-sm leading-6 text-muted'}>
        {body}
      </div>
    </div>
  );
}

function TimelineNode({ isLast, isLoading }: { isLast: boolean; isLoading?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn bg-accent/15 text-accent">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      {!isLast ? (
        <div className="mt-1 w-px flex-1 bg-line" />
      ) : null}
    </div>
  );
}

function renderCard(
  event: ConversationEvent,
  onCardAction?: (action: string) => void,
) {
  switch (event.type) {
    case 'agent_message':
      return <AgentMessageCard title={event.title} body={event.body} />;
    case 'user_message':
      return null; // handled by UserMessageBubble
    case 'plan_approval_card':
      return <PlanApprovalCard event={event} onAction={onCardAction} />;
    case 'qual_session_card':
      return <QualSessionCard event={event} />;
    case 'midrun_review_card':
      return <MidrunReviewCard event={event} onAction={onCardAction} />;
    case 'recommendation_card':
      return <RecommendationCard event={event} onAction={onCardAction} />;
    case 'study_complete_card':
      return <StudyCompleteCard event={event} onAction={onCardAction} />;
    case 'rerun_suggestion_card':
      return <RerunSuggestionCard event={event} onAction={onCardAction} />;
    default:
      return null;
  }
}

function generateTimestamp(index: number): string {
  // Start at 10:02, increment by 2-8 minutes per step
  const baseMinutes = 10 * 60 + 2;
  const offsets = [0, 1, 6, 22, 29, 30, 31, 33, 38, 42, 47, 51, 55, 58, 62, 66];
  const offset = index < offsets.length ? offsets[index] : offsets.length + index * 3;
  const totalMinutes = baseMinutes + offset;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function nowTimestamp(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const PLAYBACK_STATUS: Record<string, string> = {
  plan_approval_card: '正在生成研究计划...',
  qual_session_card: '正在执行 AI 定性访谈...',
  midrun_review_card: '定性访谈完成，准备中途审核...',
  recommendation_card: '正在执行定量排序与综合分析...',
  study_complete_card: '正在生成推荐结论...',
};

export function ConversationThread({
  events,
  visibleCount,
  isStreaming,
  onCardAction,
}: {
  events: ConversationEvent[];
  visibleCount?: number;
  isStreaming?: boolean;
  onCardAction?: (action: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const visible = visibleCount != null ? events.slice(0, visibleCount) : events;
  const nextEvent = visibleCount != null && visibleCount < events.length ? events[visibleCount] : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [visible.length]);

  return (
    <section className="space-y-0">
      {visible.map((event, index) => {
        const isNew = visibleCount != null && index === visible.length - 1;

        // User messages: right-aligned bubble
        if (event.type === 'user_message') {
          return (
            <motion.div
              key={event.id}
              className="flex justify-end pb-5"
              initial={isNew ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="max-w-[70%]">
                <div className="mb-1.5 flex items-center justify-end gap-2">
                  <span className="font-mono text-[0.6rem] text-tertiary">
                    {event.timestamp ?? nowTimestamp()}
                  </span>
                  <span className="text-xs font-medium text-muted">您</span>
                </div>
                <div className="rounded-panel bg-accent/10 border border-accent/20 px-4 py-3 text-sm leading-6 text-text">
                  {event.body}
                </div>
              </div>
              <div className="ml-3 flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn bg-action/15 text-action">
                  <User className="h-4 w-4" />
                </div>
              </div>
            </motion.div>
          );
        }

        // Agent messages and cards: left-aligned with timeline node
        return (
          <motion.div
            key={event.id}
            className="flex gap-3"
            initial={isNew ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <TimelineNode isLast={index === visible.length - 1 && !isStreaming} />
            <div className="min-w-0 flex-1 pb-5">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-xs font-medium text-muted">研究助手</span>
                <span className="font-mono text-[0.6rem] text-tertiary">
                  {event.type === 'agent_message' && event.timestamp
                    ? event.timestamp
                    : generateTimestamp(index)}
                </span>
              </div>
              {renderCard(event, onCardAction)}
            </div>
          </motion.div>
        );
      })}

      {isStreaming ? (
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TimelineNode isLast isLoading />
          <div className="min-w-0 flex-1 pb-5">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-medium text-muted">研究助手</span>
            </div>
            <div className="glass-panel flex items-center gap-3 p-4">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: '200ms' }} />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: '400ms' }} />
              </div>
              <span className="text-sm text-muted">
                {nextEvent ? (PLAYBACK_STATUS[nextEvent.type] ?? '处理中...') : '处理中...'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}

      <div ref={endRef} />
    </section>
  );
}
