import {
  AlertTriangle,
  ChevronDown,
  FileUp,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  generatePersona,
  listConsumerTwins,
  uploadPersonaPDF,
  type ConsumerTwinRecord,
} from '../services/studyRuntime';

type State =
  | { status: 'loading' }
  | { status: 'ready'; twins: ConsumerTwinRecord[] }
  | { status: 'error'; message: string };

type InputMode = 'text' | 'pdf' | 'batch';

const AUDIENCE_FILTERS = [
  '全部',
  '孕期女性',
  '新手妈妈',
  '职场宝妈',
  '95后妈妈',
  '二胎妈妈',
  '高知妈妈',
  '小镇妈妈',
  '全职妈妈',
  '备孕女性',
  '哺乳期妈妈',
] as const;

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

function DimensionBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 text-[0.65rem]">
      <span className="font-medium text-tertiary">{label}</span>
      <span className="text-muted">{value}</span>
    </div>
  );
}

function ProfileDimensions({ profile }: { profile: Record<string, unknown> }) {
  const sections: { key: string; label: string; icon: string }[] = [
    { key: 'demographics', label: '人口统计', icon: 'D' },
    { key: 'geographic', label: '地理信息', icon: 'G' },
    { key: 'behavioral', label: '行为特征', icon: 'B' },
    { key: 'psychological', label: '心理特征', icon: 'P' },
    { key: 'needs', label: '需求', icon: 'N' },
    { key: 'tech_acceptance', label: '技术接受度', icon: 'T' },
    { key: 'social_relations', label: '社交关系', icon: 'S' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map(({ key, label, icon }) => {
        const data = profile[key] as Record<string, string> | undefined;
        if (!data || typeof data !== 'object') return null;
        return (
          <div key={key} className="inner-card p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="h-5 w-5 rounded-md bg-accent/20 text-accent flex items-center justify-center text-[0.55rem] font-bold">
                {icon}
              </span>
              <span className="text-[0.65rem] font-semibold text-accent">{label}</span>
            </div>
            <div className="space-y-1">
              {Object.entries(data).map(([k, v]) => (
                <DimensionBadge key={k} label={k} value={String(v)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ConsumerTwinsPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [audienceLabel, setAudienceLabel] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('全部');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load(signal?: AbortSignal) {
    const twins = await listConsumerTwins({ signal });
    setState({ status: 'ready', twins });
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '读取数字孪生失败',
      });
    });
    return () => controller.abort();
  }, []);

  const filteredTwins = useMemo(() => {
    if (state.status !== 'ready') return [];
    let result = state.twins;

    // Filter by audience
    if (activeFilter !== '全部') {
      result = result.filter((t) => t.target_audience_label === activeFilter);
    }

    // Search by name or audience
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        const name = String(t.persona_profile_snapshot_json?.name ?? '').toLowerCase();
        const audience = String(t.target_audience_label ?? '').toLowerCase();
        const purpose = String(t.business_purpose ?? '').toLowerCase();
        return name.includes(q) || audience.includes(q) || purpose.includes(q);
      });
    }

    return result;
  }, [state, activeFilter, searchQuery]);

  async function handleGenerate() {
    if (inputMode === 'pdf') {
      if (!pdfFile || !audienceLabel.trim()) return;
      setGenerating(true);
      setGenError(null);
      try {
        await uploadPersonaPDF(pdfFile, audienceLabel);
        setPdfFile(null);
        setAudienceLabel('');
        setShowForm(false);
        const twins = await listConsumerTwins();
        setState({ status: 'ready', twins });
      } catch (error) {
        setGenError(error instanceof Error ? error.message : '上传失败，请重试');
      } finally {
        setGenerating(false);
      }
      return;
    }

    if (!text.trim() || !audienceLabel.trim()) return;
    setGenerating(true);
    setGenError(null);

    // Batch mode: split by double newlines and call batch endpoint
    if (inputMode === 'batch') {
      const texts = text.split(/\n\s*\n/).map((t) => t.trim()).filter((t) => t.length >= 30);
      if (texts.length === 0) {
        setGenError('至少需要一条 30 字以上的文本');
        setGenerating(false);
        return;
      }
      try {
        const apiBase = (import.meta.env.VITE_STUDY_RUNTIME_API_URL || 'http://127.0.0.1:8000') as string;
        const resp = await fetch(`${apiBase}/persona-profiles/generate-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts, audience_label: audienceLabel, source: 'social_media' }),
        });
        if (!resp.ok) throw new Error(`批量生成失败：${resp.status}`);
        const data = await resp.json();
        setText('');
        setAudienceLabel('');
        setShowForm(false);
        const twins = await listConsumerTwins();
        setState({ status: 'ready', twins });
        if (data.errors?.length) {
          setGenError(`成功 ${data.created} 个，${data.errors.length} 个失败`);
        }
      } catch (error) {
        setGenError(error instanceof Error ? error.message : '批量生成失败');
      } finally {
        setGenerating(false);
      }
      return;
    }

    try {
      await generatePersona(text, audienceLabel);
      setText('');
      setAudienceLabel('');
      setShowForm(false);
      const twins = await listConsumerTwins();
      setState({ status: 'ready', twins });
    } catch (error) {
      setGenError(error instanceof Error ? error.message : '生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <section className="rounded-panel border border-line bg-panel p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-sm tracking-wide text-muted">正在加载数字孪生</span>
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
            <div className="eyebrow text-danger">数字孪生</div>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
          </div>
        </div>
      </section>
    );
  }

  const totalCount = state.twins.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="rounded-panel border border-line bg-panel p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="eyebrow text-accent">消费者数字孪生</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-text">
              Persona 资产库
            </h2>
            <p className="mt-1.5 text-sm leading-7 text-muted">
              {totalCount} 个消费者画像，覆盖 {new Set(state.twins.map((t) => t.target_audience_label).filter(Boolean)).size} 个目标人群。支持搜索、筛选和独立对话。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="btn-accent"
          >
            {showForm ? <><X className="h-4 w-4" /> 取消</> : <><Plus className="h-4 w-4" /> 创建孪生</>}
          </button>
        </div>
      </section>

      {/* Creation form */}
      {showForm ? (
        <section className="glass-panel glass-panel--accent p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-accent" />
            <div className="eyebrow text-accent">从访谈数据生成 Persona</div>
          </div>

          {/* Input mode tabs */}
          <div className="flex gap-1 mb-4">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`px-3 py-1.5 rounded-btn text-xs font-medium transition ${
                inputMode === 'text' ? 'bg-accent/20 text-accent' : 'text-muted hover:text-text'
              }`}
            >
              粘贴文本
            </button>
            <button
              type="button"
              onClick={() => setInputMode('pdf')}
              className={`px-3 py-1.5 rounded-btn text-xs font-medium transition ${
                inputMode === 'pdf' ? 'bg-accent/20 text-accent' : 'text-muted hover:text-text'
              }`}
            >
              <FileUp className="inline h-3.5 w-3.5 mr-1" />
              上传 PDF
            </button>
            <button
              type="button"
              onClick={() => setInputMode('batch')}
              className={`px-3 py-1.5 rounded-btn text-xs font-medium transition ${
                inputMode === 'batch' ? 'bg-accent/20 text-accent' : 'text-muted hover:text-text'
              }`}
            >
              社媒批量导入
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="audience-label" className="text-xs font-medium text-muted">
                目标人群标签
              </label>
              <input
                id="audience-label"
                type="text"
                value={audienceLabel}
                onChange={(e) => setAudienceLabel(e.target.value)}
                placeholder="如：孕期女性、新手妈妈、职场宝妈..."
                className="mt-1 w-full rounded-btn border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none"
              />
            </div>

            {inputMode === 'text' ? (
              <div>
                <label htmlFor="interview-text" className="text-xs font-medium text-muted">
                  访谈文本
                </label>
                <textarea
                  id="interview-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="粘贴消费者访谈记录、定性报告摘要或用户画像描述文本..."
                  rows={6}
                  className="mt-1 w-full rounded-btn border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none resize-y"
                />
                <div className="mt-1 text-[0.6rem] text-tertiary">
                  至少 50 字。AI 将从文本中提取 7 个维度（人口统计/地理/行为/心理/需求/技术接受度/社交关系），自动生成可用于研究的 Persona。
                </div>
              </div>
            ) : inputMode === 'batch' ? (
              <div>
                <label htmlFor="batch-text" className="text-xs font-medium text-muted">
                  社媒文本（每段用空行分隔）
                </label>
                <textarea
                  id="batch-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={"粘贴多条社媒文本（小红书/抖音/Instagram），用空行分隔每条内容...\n\n例如：\n今天试了一款孕期饮品，口感不错，但是有点甜...\n\n作为二胎妈妈，我觉得营养品最重要的是方便..."}
                  rows={8}
                  className="mt-1 w-full rounded-btn border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none resize-y"
                />
                <div className="mt-1 text-[0.6rem] text-tertiary">
                  粘贴多条社媒帖子，用空行分隔。AI 将从每条文本中批量生成独立的 Persona。
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="pdf-upload" className="text-xs font-medium text-muted">
                  上传访谈 PDF
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <label
                    htmlFor="pdf-upload"
                    className="flex cursor-pointer items-center gap-2 rounded-btn border border-dashed border-line bg-panel px-4 py-3 text-sm text-muted transition hover:border-accent/50 hover:text-text"
                  >
                    <FileUp className="h-4 w-4" />
                    {pdfFile ? pdfFile.name : '选择 PDF 文件'}
                    <input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {pdfFile ? (
                    <button type="button" onClick={() => setPdfFile(null)} className="text-tertiary hover:text-danger">
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="mt-1 text-[0.6rem] text-tertiary">
                  支持访谈记录、定性报告等 PDF 文件。AI 将自动提取文本并生成 Persona。
                </div>
              </div>
            )}

            {genError ? (
              <div className="rounded-btn border border-danger/30 bg-dangerSoft px-3 py-2 text-sm text-danger">
                {genError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={
                generating ||
                !audienceLabel.trim() ||
                (inputMode === 'text'
                  ? text.trim().length < 50
                  : inputMode === 'batch'
                    ? text.trim().length < 30
                    : !pdfFile)
              }
              className="btn-primary"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在生成...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AI 生成 Persona
                </>
              )}
            </button>
          </div>
        </section>
      ) : null}

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索 Persona 名称、人群标签..."
            className="w-full rounded-btn border border-line bg-panel pl-9 pr-3 py-2 text-sm text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {AUDIENCE_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`rounded-btn px-2.5 py-1 text-[0.65rem] font-medium transition ${
                activeFilter === f
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'text-muted border border-transparent hover:text-text hover:bg-surfaceElevated'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-[0.65rem] text-tertiary">
        显示 {filteredTwins.length} / {totalCount} 个 Persona
      </div>

      {/* Persona Grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredTwins.length === 0 ? (
          <div className="col-span-full rounded-panel border border-line bg-panel p-8 text-center text-sm text-muted">
            {searchQuery || activeFilter !== '全部'
              ? '没有匹配的 Persona。尝试调整搜索条件或筛选标签。'
              : '暂无数字孪生资产。点击"创建孪生"从访谈文本生成第一个 Persona。'}
          </div>
        ) : null}
        {filteredTwins.map((twin) => {
          const profile = (twin.persona_profile_snapshot_json ?? {}) as Record<string, unknown>;
          const name = String(profile.name ?? twin.target_audience_label ?? twin.id);
          const ageRange = String(profile.age_range ?? '');
          const audienceTag = String(profile.audience_label ?? twin.target_audience_label ?? '');
          const geo = profile.geographic as Record<string, string> | undefined;
          const city = geo?.city ?? '';
          const tier = geo?.tier ?? '';
          const isExpanded = expandedId === twin.id;

          return (
            <article
              key={twin.id}
              className={`rounded-panel border bg-panel shadow-panel transition-all ${
                isExpanded ? 'border-accent/40 md:col-span-2 xl:col-span-3' : 'border-line'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <PersonaAvatar name={name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-base font-semibold text-text truncate">{name}</div>
                      <span className="shrink-0 rounded-btn border border-accent/30 bg-accentSoft px-1.5 py-0.5 text-[0.55rem] font-medium text-accent">
                        {audienceTag}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[0.65rem] text-muted">
                      {ageRange ? <span>{ageRange}</span> : null}
                      {city ? <span>{city}{tier ? ` · ${tier}` : ''}</span> : null}
                      <span>v{twin.latest_version_no ?? 1}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-muted line-clamp-2">
                  {twin.business_purpose ?? '该 Twin 用于支持研究执行。'}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : twin.id)}
                    className="btn-secondary-sm"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition ${isExpanded ? 'rotate-180' : ''}`} />
                    {isExpanded ? '收起' : '详情'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const profileId = twin.id;
                      navigate(`/persona/${encodeURIComponent(profileId)}/chat`);
                    }}
                    className="btn-secondary-sm"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    对话
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded ? (
                <div className="border-t border-line p-5">
                  <ProfileDimensions profile={profile} />
                  {profile.system_prompt ? (
                    <div className="mt-4 inner-card p-3">
                      <div className="text-[0.65rem] font-semibold text-accent mb-1.5">System Prompt</div>
                      <p className="text-[0.65rem] leading-5 text-muted whitespace-pre-wrap">
                        {String(profile.system_prompt)}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
