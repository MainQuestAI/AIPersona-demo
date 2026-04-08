import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useWorkbenchUiStore } from '../store/ui-store';

import type {
  QualThemeGroup,
  RankingItem,
  SegmentDifferenceItem,
} from '@/types/demo';

import { buildStudyRoute } from '../services/studyRuntimeViews';
import { rememberLatestStudySession } from '../services/studySession';
import { useLatestStudySession } from '../hooks/useLatestStudySession';
import {
  fetchWorkbenchProjection,
  type WorkbenchProjection,
} from '../services/studyRuntime';
import {
  buildDecisionSnapshotForProjection,
  buildEvidenceChainCardsForProjection,
  getPitchScenarioBundle,
} from '../services/workbenchRuntimeBridge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LoaderState =
  | { status: 'idle' | 'loading' | 'empty' }
  | { status: 'error'; errorMessage: string }
  | { status: 'ready'; projection: WorkbenchProjection };

type CompareCardData = {
  ranking: RankingItem;
  qualTheme: QualThemeGroup;
  segmentHints: SegmentDifferenceItem[];
};

/* ------------------------------------------------------------------ */
/*  Shared atoms                                                       */
/* ------------------------------------------------------------------ */

function ConfidenceBadge({
  label,
  level,
}: {
  label: string;
  level: 'high' | 'medium' | 'low';
}) {
  const cls =
    level === 'high'
      ? 'border-accent/40 bg-accentSoft text-accent'
      : level === 'medium'
        ? 'border-warning/35 bg-warningSoft text-warning'
        : 'border-danger/40 bg-dangerSoft text-danger';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.04em] ${cls}`}
    >
      {label}
    </span>
  );
}

function ThemeTag({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-line bg-surfaceElevated px-2.5 py-1 text-[0.6rem] font-medium text-muted">
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Score bar (horizontal, proportional to 100)                        */
/* ------------------------------------------------------------------ */

function ScoreBar({ score, isWinner }: { score: number; isWinner: boolean }) {
  const barColor = isWinner
    ? 'bg-accent/60'
    : 'bg-[rgba(255,255,255,0.15)]';

  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl font-bold tabular-nums tracking-tight text-text">
        {score}
      </span>
      <div className="flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single concept column card                                         */
/* ------------------------------------------------------------------ */

function ConceptCard({
  data,
  isWinner,
  rank,
  onAction,
}: {
  data: CompareCardData;
  isWinner: boolean;
  rank: number;
  onAction: (action: string) => void;
}) {
  const { ranking, qualTheme, segmentHints } = data;
  const borderCls = isWinner ? 'border-accent/30' : 'border-line';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: rank * 0.08 }}
      className={`rounded-panel border ${borderCls} bg-panel p-5 shadow-panel`}
    >
      {/* Header: name + winner badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-text">
          {ranking.label}
        </h3>
        {isWinner ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-successSoft px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.04em] text-success">
            <Sparkles className="h-3 w-3" />
            推荐
          </span>
        ) : null}
      </div>

      {/* Score bar */}
      <div className="mt-4">
        <div className="eyebrow text-muted">
          综合评分
        </div>
        <div className="mt-1.5">
          <ScoreBar score={ranking.score} isWinner={isWinner} />
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[0.6rem] text-muted">置信度</span>
          <ConfidenceBadge
            label={ranking.confidenceLabel}
            level={ranking.confidenceLevel}
          />
        </div>
      </div>

      {/* Qual themes */}
      <div className="mt-5">
        <div className="eyebrow text-muted">
          定性主题
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {qualTheme.themes.map((t) => (
            <ThemeTag key={t} label={t} />
          ))}
        </div>
      </div>

      {/* One-line summary */}
      <p className="mt-4 text-sm leading-6 text-muted">{qualTheme.summary}</p>

      {/* Segment hints */}
      {segmentHints.length > 0 ? (
        <div className="mt-5 space-y-2">
          <div className="eyebrow text-muted">
            人群差异
          </div>
          {segmentHints.map((seg) => (
            <div
              key={seg.segmentLabel}
              className="inner-card px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text">
                  {seg.segmentLabel}
                </span>
                <span className="text-[0.6rem] text-muted">
                  首选 {seg.strongestOption}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted">
                {seg.keyDifference}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        <button type="button" onClick={() => onAction(`查看 ${ranking.label} 详细报告`)} className="btn-accent">
          查看详情
        </button>
        <button type="button" onClick={() => onAction(`导出 ${ranking.label} 数据`)} className="btn-secondary !px-3 !py-1.5 !text-xs">
          <Download className="h-3.5 w-3.5" />
          导出
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  const navigate = useNavigate();
  const latestStudy = useLatestStudySession();

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-lg rounded-panel border border-line bg-panel p-6 shadow-panel"
    >
      <div className="eyebrow text-muted">
        概念对比
      </div>
      <h2 className="mt-3 text-lg font-semibold tracking-tight text-text">
        暂无可对比的研究数据
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        请先在研究工作台中创建或选择一项已完成的研究，再进入概念对比视图。
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate('/workbench')}
          className="inline-flex items-center gap-2 rounded-btn border btn-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          返回研究工作台
        </button>
        {latestStudy ? (
          <Link
            to={buildStudyRoute('/compare', latestStudy.id)}
            className="btn-secondary"
          >
            打开最近一次对比
          </Link>
        ) : null}
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function ComparePlaceholder() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const studyId = params.studyId ?? searchParams.get('studyId') ?? '';
  const [state, setState] = useState<LoaderState>({ status: 'idle' });
  const showToast = useWorkbenchUiStore((s) => s.showToast);

  function handleAction(action: string) {
    showToast(action + ' — 功能开发中');
  }

  /* ---- fetch ---------------------------------------------------- */
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
            error instanceof Error ? error.message : '读取对比数据失败',
        });
      }
    })();
    return () => {
      controller.abort();
    };
  }, [studyId]);

  /* ---- derive view model ---------------------------------------- */
  const viewData = useMemo(() => {
    if (state.status !== 'ready') return null;

    const projection = state.projection;
    const scenario = getPitchScenarioBundle(state.projection);
    const { ranking, qualThemes, segmentDifferences, recommendation } =
      scenario.resultPanel;
    const decisionSnapshot = buildDecisionSnapshotForProjection(projection);
    const evidenceChain = buildEvidenceChainCardsForProjection(projection).filter(
      (item) => item.id !== 'compare',
    );

    // Build per-concept card data, aligned by index in ranking
    const cards: CompareCardData[] = ranking.map((item) => {
      const qualTheme = qualThemes.find(
        (g) => g.stimulusId === item.stimulusId,
      ) ?? {
        stimulusId: item.stimulusId,
        label: item.label,
        themes: [],
        summary: '',
      };

      const segmentHints = segmentDifferences.filter(
        (seg) => seg.strongestOption === item.label,
      );

      return { ranking: item, qualTheme, segmentHints };
    });

    const winnerConfidenceLevel =
      cards.find((item) => item.ranking.label === recommendation.winner)?.ranking.confidenceLevel
      ?? cards[0]?.ranking.confidenceLevel
      ?? 'medium';

    return { cards, recommendation, ranking, decisionSnapshot, evidenceChain, winnerConfidenceLevel };
  }, [state]);

  /* ---- empty ---------------------------------------------------- */
  if (state.status === 'empty') {
    return <EmptyState />;
  }

  /* ---- error ---------------------------------------------------- */
  if (state.status === 'error') {
    return (
      <section className="mx-auto max-w-lg rounded-panel border border-danger/40 bg-panel p-6 shadow-panel">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <div className="eyebrow text-danger">
              加载失败
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              {state.errorMessage}
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ---- loading / idle ------------------------------------------- */
  if (
    state.status === 'loading' ||
    state.status === 'idle' ||
    !viewData
  ) {
    return (
      <section className="mx-auto max-w-lg rounded-panel border border-line bg-panel p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="eyebrow text-muted">
            正在加载对比数据
          </span>
        </div>
      </section>
    );
  }

  /* ---- ready ---------------------------------------------------- */
  const { cards, recommendation, decisionSnapshot, evidenceChain, winnerConfidenceLevel } = viewData;
  const projection = (state as { status: 'ready'; projection: WorkbenchProjection })
    .projection;

  return (
    <div className="space-y-6">
      {/* ---- Top: research conclusion headline ---- */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-panel border border-line bg-panel p-5 shadow-panel"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1">
            <div className="eyebrow text-muted">
              研究结论
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-text sm:text-2xl">
              解释为什么现在建议推进 {recommendation.winner}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {decisionSnapshot.supportingText}
            </p>
          </div>
          <ConfidenceBadge
            label={`置信度 ${recommendation.confidenceLabel}`}
            level={winnerConfidenceLevel}
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="inner-card p-3">
            <div className="eyebrow text-muted">当前建议</div>
            <div className="mt-1 text-sm font-semibold text-text">{decisionSnapshot.nextAction}</div>
          </div>
          <div className="inner-card p-3">
            <div className="eyebrow text-muted">证据覆盖</div>
            <div className="mt-1 text-sm font-semibold text-text">{decisionSnapshot.evidenceLabel}</div>
          </div>
          <div className="inner-card p-3">
            <div className="eyebrow text-muted">成本状态</div>
            <div className="mt-1 text-sm font-semibold text-text">{decisionSnapshot.costLabel}</div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {evidenceChain.map((item) => {
            const target =
              item.id === 'twins'
                ? buildStudyRoute('/twins', projection.study.id)
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
        <div className="mt-4">
          <Link
            to={buildStudyRoute('/workbench', projection.study.id)}
            className="inline-flex items-center gap-2 text-xs font-medium text-accent transition hover:text-accent/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回研究工作台
          </Link>
        </div>
      </motion.section>

      {/* ---- Main: three-column concept comparison ---- */}
      <section className="grid gap-4 lg:grid-cols-3">
        {cards.map((card, i) => (
          <ConceptCard
            key={card.ranking.stimulusId}
            data={card}
            isWinner={i === 0}
            rank={i}
            onAction={handleAction}
          />
        ))}
      </section>

      {/* ---- Bottom: recommended action ---- */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="rounded-panel border border-accent/20 bg-accentSoft p-5"
      >
        <div className="eyebrow text-accent">
          推荐行动
        </div>
        <div className="mt-2 text-base font-semibold tracking-tight text-text">
          {recommendation.nextAction}
        </div>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
          {recommendation.supportingText}
        </p>
      </motion.section>
    </div>
  );
}
