import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { STUDY_DETAIL_VIEWS } from '@/types/route';

import {
  fetchWorkbenchProjection,
  type StudyDetailProjection,
} from '../services/studyRuntime';
import { buildStudyRoute } from '../services/studyRuntimeViews';
import {
  buildDecisionSnapshotForProjection,
  buildEvidenceChainCardsForProjection,
} from '../services/workbenchRuntimeBridge';

type LoaderState =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; errorMessage: string }
  | { status: 'ready'; projection: StudyDetailProjection };

export function StudyDetailLayout() {
  const { studyId = '' } = useParams();
  const location = useLocation();
  const [state, setState] = useState<LoaderState>({ status: 'idle' });

  useEffect(() => {
    if (!studyId) {
      setState({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading' });
    void (async () => {
      try {
        const projection = await fetchWorkbenchProjection(studyId, {
          signal: controller.signal,
        });
        setState({ status: 'ready', projection });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setState({
          status: 'error',
          errorMessage: error instanceof Error ? error.message : '读取研究详情失败',
        });
      }
    })();

    return () => {
      controller.abort();
    };
  }, [studyId]);

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
    return buildEvidenceChainCardsForProjection(state.projection);
  }, [state]);

  const businessQuestion =
    state.status === 'ready'
      ? state.projection.study.business_question
      : 'Workbench、Compare 和 Twins 已被收编进同一个 Study Detail。';

  function getEvidenceTarget(cardId: 'compare' | 'twins' | 'trust' | 'replay'): string {
    if (cardId === 'compare') {
      return buildStudyRoute('/compare', studyId);
    }
    if (cardId === 'twins') {
      return buildStudyRoute('/twins', studyId);
    }
    return `${buildStudyRoute('/workbench', studyId)}?focus=${cardId}`;
  }

  return (
    <div className="h-full space-y-4">
      <section className="rounded-panel border border-line bg-panel p-5 shadow-panel">
        <div className="eyebrow text-accent">Study Detail</div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-text">
              {decisionSnapshot?.headline ?? '统一研究详情主舞台'}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              {decisionSnapshot?.supportingText ?? businessQuestion}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {decisionSnapshot ? (
              <>
                <div className="rounded-btn border border-accent/30 bg-accentSoft px-3 py-1 text-[0.7rem] font-semibold text-accent">
                  置信度 {decisionSnapshot.confidenceLabel}
                </div>
                <div className="rounded-btn border border-line bg-panel px-3 py-1 text-[0.7rem] font-semibold text-muted">
                  {decisionSnapshot.costLabel}
                </div>
              </>
            ) : null}
            <div className="rounded-btn border border-accent/30 bg-accentSoft px-3 py-1 text-[0.7rem] font-semibold text-accent">
              {studyId}
            </div>
          </div>
        </div>
        {decisionSnapshot ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="inner-card p-3">
              <div className="eyebrow text-muted">下一步建议</div>
              <div className="mt-1 text-sm font-semibold text-text">{decisionSnapshot.nextAction}</div>
            </div>
            <div className="inner-card p-3">
              <div className="eyebrow text-muted">运行消耗</div>
              <div className="mt-1 text-sm font-semibold text-text">{decisionSnapshot.tokenLabel}</div>
            </div>
            <div className="inner-card p-3">
              <div className="eyebrow text-muted">证据覆盖</div>
              <div className="mt-1 text-sm font-semibold text-text">{decisionSnapshot.evidenceLabel}</div>
            </div>
          </div>
        ) : null}
        {state.status === 'error' ? (
          <div className="mt-4 rounded-card border border-danger/30 bg-dangerSoft px-4 py-3 text-sm text-danger">
            {state.errorMessage}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {STUDY_DETAIL_VIEWS.map((view) => (
            <NavLink
              key={view.key}
              to={buildStudyRoute(`/${view.key}`, studyId)}
              className={({ isActive }) =>
                [
                  'rounded-btn border px-3 py-1 text-[0.7rem] font-semibold transition',
                  isActive || location.pathname.endsWith(`/${view.key}`)
                    ? 'border-accent/35 bg-accentSoft text-text'
                    : 'border-line bg-panel text-muted hover:border-accent/35 hover:text-text',
                ].join(' ')
              }
            >
              {view.label}
            </NavLink>
          ))}
        </div>
        {evidenceChain.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {evidenceChain.map((card) => (
              <Link
                key={card.id}
                to={getEvidenceTarget(card.id)}
                className="inner-card p-4 transition hover:border-accent/35 hover:bg-accentSoft/40"
              >
                <div className="eyebrow text-accent">{card.label}</div>
                <div className="mt-2 text-sm font-semibold text-text">{card.headline}</div>
                <div className="mt-1 text-xs leading-5 text-muted">{card.detail}</div>
                <div className="mt-3 text-xs font-semibold text-accent">{card.ctaLabel}</div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
      <Outlet />
    </div>
  );
}
