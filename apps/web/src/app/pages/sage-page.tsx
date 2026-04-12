import { BookOpen, Loader2, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const API_BASE = (import.meta.env.VITE_STUDY_RUNTIME_API_URL || 'http://127.0.0.1:8000') as string;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export function SagePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [knowledgeContext, setKnowledgeContext] = useState('');
  const [showKnowledge, setShowKnowledge] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const resp = await fetch(`${API_BASE}/sage/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          knowledge_context: knowledgeContext,
        }),
      });
      const data = await resp.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || '暂时无法回答' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '服务暂时不可用' }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-none border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">AI Sage</h2>
            <p className="text-[0.65rem] text-muted">
              基于研究知识库的专家顾问 · 消费者洞察 · 战略建议
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowKnowledge((v) => !v)}
            className="ml-auto btn-secondary-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {showKnowledge ? '收起知识' : '导入知识'}
          </button>
        </div>

        {showKnowledge ? (
          <div className="mt-3 glass-panel p-4">
            <div className="eyebrow text-accent mb-2">知识导入</div>
            <textarea
              value={knowledgeContext}
              onChange={(e) => setKnowledgeContext(e.target.value)}
              placeholder="粘贴行业报告、竞品分析、内部文档等文本，AI Sage 将基于此知识回答问题..."
              rows={4}
              className="w-full rounded-btn border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none resize-y"
            />
            <div className="mt-1 text-[0.6rem] text-tertiary">
              知识会与历史研究记忆合并，为 AI Sage 提供更丰富的分析上下文。
            </div>
          </div>
        ) : null}
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="glass-panel p-5 max-w-md">
              <div className="eyebrow text-accent mb-2">AI Sage 专家顾问</div>
              <p className="text-sm text-muted leading-6">
                我是基于你的研究数据训练的专家顾问。你可以向我咨询消费者洞察、品牌策略、市场趋势等问题。
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                {[
                  '当前市场上妈妈群体最关心什么？',
                  '清泉+ 的定位策略建议',
                  '如何提高概念测试的可信度？',
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setInput(q)}
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
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' ? (
              <div className="h-8 w-8 shrink-0 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                <BookOpen className="h-4 w-4" />
              </div>
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
            <div className="h-8 w-8 shrink-0 rounded-full bg-accent/15 flex items-center justify-center text-accent">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="glass-panel rounded-xl px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
            </div>
          </div>
        ) : null}
      </div>

      {/* Input */}
      <div className="flex-none border-t border-line pt-3">
        <form onSubmit={(e) => { e.preventDefault(); void handleSend(); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="向 AI Sage 提问..."
            disabled={sending}
            className="flex-1 rounded-btn border border-line bg-panel px-4 py-2.5 text-sm text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none disabled:opacity-50"
          />
          <button type="submit" disabled={!input.trim() || sending} className="btn-accent shrink-0">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
