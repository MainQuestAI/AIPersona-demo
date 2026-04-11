import { useEffect, useRef } from 'react';
import { Bot, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AgentMessage } from '@/app/services/studyRuntime';
import ReactMarkdown from 'react-markdown';

function AgentAvatar({ isLoading }: { isLoading?: boolean }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn bg-accent/15 text-accent">
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function ProgressMessage({ message }: { message: AgentMessage }) {
  const meta = message.metadata_json as Record<string, unknown>;
  const current = Number(meta.current ?? 0);
  const total = Number(meta.total ?? 0);
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="glass-panel flex items-center gap-3 p-3">
      <div className="flex gap-1 self-start pt-0.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: '200ms' }} />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: '400ms' }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-muted">{message.content}</div>
        {total > 0 ? (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[0.65rem] text-tertiary">
              <span>{current} / {total}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surfaceElevated">
              <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ActionRequestMessage({
  message,
  onAction,
}: {
  message: AgentMessage;
  onAction: (actionId: string, action: string) => void;
}) {
  const meta = message.metadata_json as Record<string, unknown>;
  const actions = Array.isArray(meta.actions) ? meta.actions.map(String) : [];
  const actionId = String(meta.action_id ?? '');

  return (
    <div className="glass-panel glass-panel--action p-4">
      <div className="text-sm leading-6 text-muted prose-invert">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
      {actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((action, i) => (
            <button
              key={action}
              type="button"
              onClick={() => onAction(actionId, action)}
              className={i === 0 ? 'btn-primary' : 'btn-secondary'}
            >
              {action}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CardMessage({ message }: { message: AgentMessage }) {
  return (
    <div className="glass-panel glass-panel--accent p-4">
      <div className="text-sm leading-6 text-text prose-invert">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
}

function TextMessage({ message }: { message: AgentMessage }) {
  return (
    <div className="glass-panel p-4">
      <div className="text-sm leading-6 text-muted prose-invert">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: AgentMessage }) {
  return (
    <div className="glass-panel glass-panel--danger p-4">
      <div className="text-sm text-danger">{message.content}</div>
    </div>
  );
}

function renderAgentMessage(
  message: AgentMessage,
  onAction: (actionId: string, action: string) => void,
) {
  switch (message.message_type) {
    case 'progress':
      return <ProgressMessage message={message} />;
    case 'action_request':
      return <ActionRequestMessage message={message} onAction={onAction} />;
    case 'card':
      return <CardMessage message={message} />;
    case 'error':
      return <ErrorMessage message={message} />;
    case 'text':
    default:
      return <TextMessage message={message} />;
  }
}

export function AgentConversation({
  messages,
  sending,
  onAction,
}: {
  messages: AgentMessage[];
  sending?: boolean;
  onAction: (actionId: string, action: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  return (
    <section className="space-y-0">
      {messages.map((message, index) => {
        const isNew = index === messages.length - 1;

        if (message.role === 'user') {
          return (
            <motion.div
              key={message.id}
              className="flex justify-end pb-4"
              initial={isNew ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-[70%]">
                <div className="mb-1.5 flex items-center justify-end gap-2">
                  <span className="font-mono text-[0.6rem] text-tertiary">{formatTime(message.created_at)}</span>
                  <span className="text-xs font-medium text-muted">您</span>
                </div>
                <div className="rounded-panel bg-accent/10 border border-accent/20 px-4 py-3 text-sm leading-6 text-text">
                  {message.content}
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

        // Agent messages
        return (
          <motion.div
            key={message.id}
            className="flex gap-3 pb-4"
            initial={isNew ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center">
              <AgentAvatar isLoading={message.message_type === 'progress'} />
              {index < messages.length - 1 ? <div className="mt-1 w-px flex-1 bg-line" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-xs font-medium text-muted">研究助手</span>
                <span className="font-mono text-[0.6rem] text-tertiary">{formatTime(message.created_at)}</span>
              </div>
              {renderAgentMessage(message, onAction)}
            </div>
          </motion.div>
        );
      })}

      {sending ? (
        <motion.div
          className="flex gap-3 pb-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AgentAvatar isLoading />
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 text-xs font-medium text-muted">研究助手</div>
            <div className="glass-panel flex items-center gap-3 p-4">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: '200ms' }} />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: '400ms' }} />
              </div>
              <span className="text-sm text-muted">正在思考...</span>
            </div>
          </div>
        </motion.div>
      ) : null}

      <div ref={endRef} />
    </section>
  );
}
