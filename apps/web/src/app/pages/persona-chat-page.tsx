import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  chatWithPersona,
  listConsumerTwins,
  type ConsumerTwinRecord,
} from '../services/studyRuntime';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function PersonaAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const hue = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  const sizeClasses = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  const initial = name.replace(/[·]/g, '').slice(-1) || '?';
  return (
    <div
      className={`${sizeClasses[size]} shrink-0 rounded-full flex items-center justify-center font-bold text-white shadow-lg`}
      style={{ backgroundColor: `hsl(${hue}, 55%, 45%)`, boxShadow: `0 0 12px hsla(${hue}, 55%, 45%, 0.4)` }}
    >
      {initial}
    </div>
  );
}

export function PersonaChatPage() {
  const navigate = useNavigate();
  const { profileId = '' } = useParams();

  const [twin, setTwin] = useState<ConsumerTwinRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load the twin data
  useEffect(() => {
    let active = true;
    async function loadTwin() {
      try {
        const twins = await listConsumerTwins();
        if (!active) return;
        const match = twins.find((t) => t.id === profileId);
        setTwin(match ?? null);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadTwin();
    return () => { active = false; };
  }, [profileId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
      const { reply } = await chatWithPersona(profileId, text, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '抱歉，对话服务暂时不可用。' }]);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!twin) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted">未找到该 Persona</p>
        <button type="button" onClick={() => navigate('/consumer-twins')} className="btn-secondary">
          返回 Persona 列表
        </button>
      </div>
    );
  }

  const profile = (twin.persona_profile_snapshot_json ?? {}) as Record<string, unknown>;
  const name = String(profile.name ?? twin.target_audience_label ?? '消费者');
  const audienceLabel = String(profile.audience_label ?? twin.target_audience_label ?? '');
  const ageRange = String(profile.age_range ?? '');
  const geo = profile.geographic as Record<string, string> | undefined;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-none border-b border-line pb-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/consumer-twins')}
            className="btn-secondary-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <PersonaAvatar name={name} size="lg" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-text truncate">{name}</h2>
            <div className="flex items-center gap-2 text-[0.65rem] text-muted">
              <span className="rounded-btn border border-accent/30 bg-accentSoft px-1.5 py-0.5 font-medium text-accent">
                {audienceLabel}
              </span>
              {ageRange ? <span>{ageRange}</span> : null}
              {geo?.city ? <span>{geo.city}</span> : null}
            </div>
            <p className="mt-1 text-[0.65rem] text-tertiary line-clamp-1">
              {twin.business_purpose ?? ''}
            </p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <PersonaAvatar name={name} size="lg" />
            <div className="glass-panel p-5 max-w-sm">
              <p className="text-sm text-muted">
                你好！我是<span className="font-medium text-text">{name}</span>。
                你可以像真实消费者访谈一样跟我聊天。
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                {['你平时都喝什么饮料？', '你对营养成分在意吗？', '买饮品最看重什么？'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => { setInput(q); }}
                    className="rounded-btn border border-line bg-panel px-2.5 py-1 text-[0.65rem] text-muted hover:text-text hover:border-accent/30 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {messages.map((msg, i) => (
          <div key={`${msg.role}-${i}-${msg.content.slice(0, 20)}`} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' ? (
              <PersonaAvatar name={name} size="sm" />
            ) : null}
            <div
              className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-6 ${
                msg.role === 'user'
                  ? 'bg-accent/20 text-text'
                  : 'glass-panel text-muted'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sending ? (
          <div className="flex gap-3 justify-start">
            <PersonaAvatar name={name} size="sm" />
            <div className="glass-panel rounded-xl px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
            </div>
          </div>
        ) : null}
      </div>

      {/* Input area */}
      <div className="flex-none border-t border-line pt-3">
        <form
          onSubmit={(e) => { e.preventDefault(); void handleSend(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`向 ${name} 提问...`}
            disabled={sending}
            className="flex-1 rounded-btn border border-line bg-panel px-4 py-2.5 text-sm text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="btn-accent shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
