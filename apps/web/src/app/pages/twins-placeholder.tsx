import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CircleDashed,
  Database,
  Fingerprint,
  Loader2,
  MessageCircle,
  Settings2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useWorkbenchUiStore } from '../store/ui-store';

import type { TwinProfile } from '@/types/demo';

import {
  fetchWorkbenchProjection,
  type WorkbenchProjection,
} from '../services/studyRuntime';
import { rememberLatestStudySession } from '../services/studySession';
import {
  buildStudyRoute,
  buildTwinRegistryModel,
} from '../services/studyRuntimeViews';
import {
  buildDecisionSnapshotForProjection,
  buildEvidenceChainCardsForProjection,
  getPitchScenarioBundle,
} from '../services/workbenchRuntimeBridge';
import { useLatestStudySession } from '../hooks/useLatestStudySession';

type LoaderState =
  | { status: 'idle' | 'loading' | 'empty' }
  | { status: 'error'; errorMessage: string }
  | { status: 'ready'; projection: WorkbenchProjection };

/* ------------------------------------------------------------------ */
/*  Twin Profile Card                                                  */
/* ------------------------------------------------------------------ */

function TwinProfileCard({ twin, onAction }: { twin: TwinProfile; onAction: (action: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel p-6"
    >
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold tracking-wide text-text">
            {twin.name}
          </h3>
          <p className="mt-1 text-sm text-muted">{twin.audienceLabel}</p>
        </div>
        <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-panel border border-accent/25 bg-accentSoft text-accent">
          <Fingerprint className="h-5 w-5" />
        </div>
      </div>

      {/* meta rows */}
      <div className="mt-5 space-y-3">
        <MetaRow label="绑定人群" value={twin.ageRange} />
        <MetaRow label="构建来源" value={twin.builtFrom} />
        <MetaRow label="版本说明" value={twin.versionNotes} />
      </div>

      {/* research readiness chips */}
      <div className="mt-5">
        <div className="eyebrow text-muted">适用研究类型</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {twin.researchReadiness.map((tag) => (
            <span key={tag} className="btn-chip cursor-default">{tag}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        <button type="button" onClick={() => onAction(`与 ${twin.name} 对话`)} className="btn-accent">
          <MessageCircle className="h-3.5 w-3.5" />
          与孪生对话
        </button>
        <button type="button" onClick={() => onAction(`配置 ${twin.name}`)} className="btn-secondary-sm">
          <Settings2 className="h-3.5 w-3.5" />
          配置参数
        </button>
      </div>
    </motion.div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-card border border-line bg-panel px-4 py-2.5">
      <span className="flex-shrink-0 text-xs text-muted">{label}</span>
      <span className="text-right text-sm text-text">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  const navigate = useNavigate();
  const latestStudy = useLatestStudySession();
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-panel border border-line bg-panel p-6 shadow-panel"
    >
      <div className="flex items-center gap-3">
        <CircleDashed className="h-6 w-6 text-accent" />
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-[0.06em] text-text">
            尚未关联研究项目
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
            当前没有关联的研究上下文，无法展示数字孪生资产。请先回到工作台打开一个研究项目，再从导航切换至此页面。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                navigate('/workbench');
              }}
              className="rounded-panel border btn-accent"
            >
              回到工作台
            </button>
            {latestStudy ? (
              <Link
                to={buildStudyRoute('/twins', latestStudy.id)}
                className="btn-secondary"
              >
                打开最近一次研究的孪生
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function TwinsPlaceholder() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const studyId = params.studyId ?? searchParams.get('studyId') ?? '';
  const [state, setState] = useState<LoaderState>({ status: 'idle' });
  const showToast = useWorkbenchUiStore((s) => s.showToast);

  function handleTwinAction(action: string) {
    showToast(action + ' — 功能开发中');
  }

  useEffect(() => {
    if (!studyId) {
      setState({ status: 'empty' });
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
            error instanceof Error ? error.message : '读取数字孪生数据失败',
        });
      }
    })();
    return () => {
      controller.abort();
    };
  }, [studyId]);

  const registry = useMemo(() => {
    if (state.status !== 'ready') {
      return null;
    }
    return buildTwinRegistryModel(state.projection);
  }, [state]);

  const twinProfiles = useMemo(() => {
    if (state.status !== 'ready') {
      return [];
    }
    const scenario = getPitchScenarioBundle(state.projection);
    return scenario.twinCatalog;
  }, [state]);

  const decisionSnapshot = useMemo(() => {
    if (state.status !== 'ready') {
      return null;
    }
    return buildDecisionSnapshotForProjection(state.projection);
  }, [state]);

  const evidenceChain = useMemo(() => {
    if (state.status !== 'ready') {
      return [];
    }
    return buildEvidenceChainCardsForProjection(state.projection).filter(
      (item) => item.id !== 'twins',
    );
  }, [state]);

  if (state.status === 'empty') {
    return <EmptyState />;
  }

  if (state.status === 'error') {
    return (
      <section className="rounded-panel border border-line bg-panel p-6 shadow-panel">
        <div className="flex items-start gap-3 text-danger">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />
          <div>
            <div className="eyebrow text-danger">
              加载失败
            </div>
            <div className="mt-2 text-sm text-muted">{state.errorMessage}</div>
          </div>
        </div>
      </section>
    );
  }

  const projection = state.status === 'ready' ? state.projection : null;

  if (state.status === 'loading' || state.status === 'idle' || !registry || !projection) {
    return (
      <section className="rounded-panel border border-line bg-panel p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-sm tracking-wide text-muted">
            正在加载数字孪生数据...
          </span>
        </div>
      </section>
    );
  }

  const twinCount = twinProfiles.length || (registry.cards.length);
  const lastUpdated = projection.current_run?.updated_at ?? projection.latest_plan_version?.created_at;

  return (
    <div className="space-y-6">
      {/* ---- Header: Asset Overview ---- */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-panel border border-line bg-panel p-6 shadow-panel sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-accent/30 bg-accent/12 px-3 py-1 eyebrow text-accent">
                数字孪生
              </span>
              <span className="rounded-full border border-line/80 bg-panel px-3 py-1 eyebrow text-muted">
                {twinCount} 个孪生资产
              </span>
              {lastUpdated ? (
                <span className="eyebrow text-muted">
                  最近更新 {lastUpdated}
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-[0.06em] text-text sm:text-3xl">
              消费者数字孪生
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
              {decisionSnapshot
                ? `${decisionSnapshot.headline}。当前推荐的证据基础，来自这些真实人群孪生及其来源资产。`
                : '以下数字孪生资产基于真实消费者定性报告和访谈录音构建，用于在 AI 研究流程中代表目标人群进行概念评估和偏好排序。'}
            </p>
          </div>
          <Link
            to={buildStudyRoute('/workbench', projection.study.id)}
            className="btn-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            返回工作台
          </Link>
        </div>
        {decisionSnapshot ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="inner-card p-3">
              <div className="eyebrow text-muted">证据覆盖</div>
              <div className="mt-1 text-sm font-semibold text-text">{decisionSnapshot.evidenceLabel}</div>
            </div>
            <div className="inner-card p-3">
              <div className="eyebrow text-muted">当前建议</div>
              <div className="mt-1 text-sm font-semibold text-text">{decisionSnapshot.nextAction}</div>
            </div>
            <div className="inner-card p-3">
              <div className="eyebrow text-muted">成本状态</div>
              <div className="mt-1 text-sm font-semibold text-text">{decisionSnapshot.costLabel}</div>
            </div>
          </div>
        ) : null}
        {evidenceChain.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {evidenceChain.map((item) => {
              const target =
                item.id === 'compare'
                  ? buildStudyRoute('/compare', projection.study.id)
                  : `${buildStudyRoute('/workbench', projection.study.id)}?focus=${item.id}`;

              return (
                <Link
                  key={item.id}
                  to={target}
                  className="inner-card p-4 transition hover:border-accent/35 hover:bg-accentSoft/30"
                >
                  <div className="eyebrow text-accent">{item.label}</div>
                  <div className="mt-2 text-sm font-semibold text-text">{item.headline}</div>
                  <div className="mt-1 text-xs leading-5 text-muted">{item.detail}</div>
                  <div className="mt-3 text-xs font-semibold text-accent">{item.ctaLabel}</div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </motion.section>

      {/* ---- Twin Profile Cards ---- */}
      {twinProfiles.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2">
          {twinProfiles.map((twin) => (
            <TwinProfileCard key={twin.id} twin={twin} onAction={handleTwinAction} />
          ))}
        </section>
      ) : registry.cards.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2">
          {registry.cards.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-panel border border-line bg-panel p-6 shadow-panel"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-wide text-text">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{card.detail}</p>
                </div>
                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-panel border border-accent/25 bg-accent/12 text-accent">
                  <Fingerprint className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {card.chips.map((chip) => (
                  <span
                    key={chip}
                    className="btn-chip cursor-default"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </section>
      ) : (
        <section className="rounded-panel border border-line bg-panel p-6 shadow-panel">
          <div className="flex items-center gap-3">
            <CircleDashed className="h-5 w-5 text-muted" />
            <p className="text-sm text-muted">
              当前研究计划尚未绑定数字孪生资产，请在工作台完成计划配置后再查看。
            </p>
          </div>
        </section>
      )}

      {/* ---- Data Source Description ---- */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-panel border border-line bg-panel p-6 shadow-panel"
      >
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold tracking-wide text-text">
            数据来源说明
          </h3>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SourceItem
            title="定性报告"
            description="基于目标人群的深度访谈和焦点小组报告，提取消费者态度、价值观与决策逻辑。"
          />
          <SourceItem
            title="访谈录音"
            description="原始消费者访谈录音经 AI 转录后，抽取关键语义信号用于孪生校准。"
          />
          <SourceItem
            title="持续校准"
            description="每次研究迭代后，孪生模型根据新数据进行版本更新，确保与真实消费者行为一致。"
          />
        </div>
      </motion.section>
    </div>
  );
}

function SourceItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-card border border-line bg-panel px-4 py-3.5">
      <div className="text-sm font-medium text-text">{title}</div>
      <p className="mt-1.5 text-xs leading-5 text-muted">{description}</p>
    </div>
  );
}
