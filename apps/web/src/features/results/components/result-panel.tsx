import { useState } from 'react';
import type { DemoScenarioBundle } from '@/types/demo';
import type { WorkbenchProjection } from '@/app/services/studyRuntime';

import { PodcastPlayer } from './podcast-player';
import { QuantRanking } from './quant-ranking';
import { QualThemesSummary } from './qual-themes-summary';
import { RecommendationSummary } from './recommendation-summary';
import { SegmentDifferencePanel } from './segment-difference-panel';

type TabId = 'findings' | 'evidence' | 'replay';

export function ResultPanel({
  projection,
  scenario,
  onOpenCompare,
  onOpenReplay: _onOpenReplay,
  onOpenTrust,
  onOpenTwins,
  onOpenInputs,
  onCardAction,
}: {
  projection: WorkbenchProjection;
  scenario: DemoScenarioBundle;
  onOpenCompare: () => void;
  onOpenReplay: () => void;
  onOpenTrust: () => void;
  onOpenTwins: () => void;
  onOpenInputs: () => void;
  onCardAction?: (action: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>('findings');
  const runStatus = projection.current_run?.status;
  const isComplete = runStatus === 'succeeded' || projection.study.status === 'completed';
  const rawApprovalStatus = projection.latest_plan_version?.approval_status;
  const APPROVAL_LABELS: Record<string, string> = {
    draft: '草稿',
    pending_approval: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    superseded: '已替代',
  };
  const approvalStatus = rawApprovalStatus;
  const approvalLabel = (rawApprovalStatus ? APPROVAL_LABELS[rawApprovalStatus] : undefined) ?? '草稿';

  // Mid-run review state
  if (runStatus === 'awaiting_midrun_approval') {
    return (
      <section className="space-y-4">
        <div className="glass-panel glass-panel--warning p-5">
          <div className="eyebrow text-warning">中途审核</div>
          <div className="mt-2 text-lg font-semibold tracking-[-0.02em] text-text">
            {scenario.midrunReviewPanel?.title ?? '等待审核确认'}
          </div>
          <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
            {scenario.midrunReviewPanel?.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {scenario.midrunReviewPanel?.decisionSummary ? (
            <div className="mt-4 rounded-panel border border-warning/20 bg-warning/10 px-4 py-3 text-sm leading-6 text-text">
              {scenario.midrunReviewPanel.decisionSummary}
            </div>
          ) : null}
          {scenario.midrunReviewPanel?.metrics && scenario.midrunReviewPanel.metrics.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {scenario.midrunReviewPanel.metrics.map((metric) => (
                <div key={metric.label} className="inner-card px-3 py-3 text-sm">
                  <div className="text-[0.65rem] font-semibold tracking-[0.04em] text-tertiary">
                    {metric.label}
                  </div>
                  <div className={`mt-1 font-semibold ${
                    metric.tone === 'positive'
                      ? 'text-accent'
                      : metric.tone === 'warning'
                        ? 'text-warning'
                        : 'text-text'
                  }`}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {scenario.midrunReviewPanel?.focusThemes.length ? (
            <div className="mt-4">
              <div className="text-[0.65rem] font-semibold tracking-[0.04em] text-tertiary">
                当前重点主题
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {scenario.midrunReviewPanel.focusThemes.map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {scenario.midrunReviewPanel?.recommendation ? (
            <div className="mt-4 rounded-panel border border-line bg-surface/75 px-4 py-3 text-sm leading-6 text-muted">
              <span className="font-semibold text-text">当前建议：</span>
              {scenario.midrunReviewPanel.recommendation}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {scenario.midrunReviewPanel?.actions.map((action) => (
              <button key={action} type="button" className="btn-warning" onClick={() => onCardAction?.(action)}>
                {action}
              </button>
            ))}
          </div>
        </div>
        <QualThemesSummary groups={scenario.resultPanel.qualThemes} />
      </section>
    );
  }

  // Rerun suggestion state
  if (runStatus === 'failed') {
    return (
      <section className="space-y-4">
        <div className="glass-panel glass-panel--danger p-5">
          <div className="eyebrow text-danger">重跑建议</div>
          <div className="mt-2 text-lg font-semibold tracking-[-0.02em] text-text">
            {scenario.rerunSuggestionPanel?.title ?? '建议重新执行'}
          </div>
          <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
            {scenario.rerunSuggestionPanel?.reason.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {scenario.rerunSuggestionPanel?.actions.map((action) => (
              <button key={action} type="button" className="btn-action" onClick={() => onCardAction?.(action)}>
                {action}
              </button>
            ))}
          </div>
        </div>
        <QuantRanking ranking={scenario.resultPanel.ranking} />
      </section>
    );
  }

  if (runStatus === 'running' || runStatus === 'queued') {
    const steps = projection.current_run?.steps ?? [];
    const STAGE_ORDER = [
      { type: 'twin_preparation', label: '定性访谈' },
      { type: 'qual_execution', label: '主题提取' },
      { type: 'quant_execution', label: 'AI 综合评估' },
      { type: 'synthesis', label: '推荐结论' },
    ];
    const stepMap = new Map(steps.map((s) => [s.step_type, s]));
    const runningStep = steps.find((s) => s.status === 'running');
    const currentLabel = STAGE_ORDER.find((s) => s.type === runningStep?.step_type)?.label ?? '准备中';

    function formatElapsed(startedAt?: string | null, endedAt?: string | null): string | null {
      if (!startedAt) return null;
      const start = new Date(startedAt).getTime();
      const end = endedAt ? new Date(endedAt).getTime() : Date.now();
      const seconds = Math.round((end - start) / 1000);
      if (seconds < 60) return `${seconds}s`;
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    }

    return (
      <section className="space-y-4">
        <div className="glass-panel glass-panel--action p-5">
          <div className="eyebrow text-action">研究执行中</div>
          <div className="mt-2 text-lg font-semibold tracking-[-0.02em] text-text">
            {currentLabel}
          </div>
          <div className="mt-4 space-y-2">
            {STAGE_ORDER.map((stage) => {
              const step = stepMap.get(stage.type);
              const isDone = step?.status === 'succeeded';
              const isRunning = step?.status === 'running';
              const elapsed = formatElapsed(step?.started_at, step?.ended_at);
              return (
                <div key={stage.type} className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    isDone ? 'bg-accent shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                    : isRunning ? 'bg-action animate-pulse shadow-[0_0_6px_rgba(255,107,43,0.5)]'
                    : 'bg-surfaceElevated'
                  }`} />
                  <span className={`flex-1 text-sm ${isDone ? 'text-accent' : isRunning ? 'text-text font-medium' : 'text-tertiary'}`}>
                    {stage.label}
                  </span>
                  {elapsed ? (
                    <span className={`font-mono text-[0.6rem] ${isDone ? 'text-accent' : 'text-muted'}`}>
                      {elapsed}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onOpenInputs} className="btn-chip">查看输入源</button>
            <button type="button" onClick={onOpenTwins} className="btn-chip">查看孪生溯源</button>
            <button type="button" onClick={onOpenTrust} className="btn-chip">查看可信度</button>
          </div>
        </div>
      </section>
    );
  }

  // Plan phase
  if (!projection.current_run || approvalStatus === 'draft' || approvalStatus === 'pending_approval') {
    return (
      <section className="space-y-4">
        <div className="glass-panel p-5">
          <div className="eyebrow text-muted">研究计划</div>
          <div className="mt-2 text-lg font-semibold tracking-[-0.02em] text-text">
            研究计划概览
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="inner-card px-3 py-2 text-sm">
              <span className="text-tertiary">审批：</span>
              <span className="text-text">{approvalLabel}</span>
            </div>
            <div className="inner-card px-3 py-2 text-sm">
              <span className="text-tertiary">刺激物：</span>
              <span className="text-text">{projection.latest_plan_version?.stimulus_count ?? 0} 个</span>
            </div>
            <div className="inner-card px-3 py-2 text-sm">
              <span className="text-tertiary">孪生：</span>
              <span className="text-text">{projection.latest_plan_version?.twin_count ?? 0} 组</span>
            </div>
            <div className="inner-card px-3 py-2 text-sm">
              <span className="text-tertiary">版本：</span>
              <span className="text-text">{projection.plan.current_execution_version_id ? '已锁定' : '待确认'}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onOpenInputs} className="btn-chip">查看输入源</button>
            <button type="button" onClick={onOpenTrust} className="btn-chip">查看可信度</button>
          </div>
        </div>
      </section>
    );
  }

  // Completed state — Tab view
  return (
    <section className="space-y-4">
      <RecommendationSummary recommendation={scenario.resultPanel.recommendation} />

      {/* Tab bar */}
      <div className="tab-bar">
        {(['findings', 'evidence', 'replay'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`tab-item ${activeTab === id ? 'tab-item--active' : ''}`}
          >
            {id === 'findings' ? '研究结论' : id === 'evidence' ? '证据链' : '研究回放'}
          </button>
        ))}
      </div>

      {activeTab === 'findings' ? (
        <div className="space-y-4">
          <QuantRanking ranking={scenario.resultPanel.ranking} />
          <QualThemesSummary groups={scenario.resultPanel.qualThemes} />
          <SegmentDifferencePanel items={scenario.resultPanel.segmentDifferences} />
        </div>
      ) : null}

      {activeTab === 'evidence' ? (
        <div className="space-y-3">
          {[
            { label: '可信度与校准', desc: '置信度评分、标杆包版本、校准记录和审批轨迹', onClick: onOpenTrust },
            { label: '数字孪生溯源', desc: '消费者数字孪生的身份、来源、版本和适用范围', onClick: onOpenTwins },
            { label: '输入源', desc: '研究使用的定性报告、访谈录音和定量数据集', onClick: onOpenInputs },
            { label: '刺激物对比', desc: '各概念在不同目标人群中的表现差异', onClick: onOpenCompare },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="inner-card w-full p-4 text-left"
            >
              <div className="text-xs font-semibold text-accent">{item.label}</div>
              <div className="mt-1 text-sm text-muted">{item.desc}</div>
            </button>
          ))}
        </div>
      ) : null}

      {activeTab === 'replay' ? (
        <div className="space-y-3">
          {scenario.replay.stages.map((stage) => (
            <div key={stage.id} className="inner-card p-4">
              <div className="text-xs font-semibold text-accent">{stage.label}</div>
              <div className="mt-2 grid gap-2 text-xs text-muted">
                <div><span className="text-tertiary">输入：</span>{stage.inputs.join('、')}</div>
                <div><span className="text-tertiary">输出：</span>{stage.outputs.join('、')}</div>
                <div><span className="text-tertiary">决策：</span>{stage.decisions.join('、')}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Insight Radio */}
      {isComplete ? <PodcastPlayer studyId={projection.study.id} /> : null}

      {/* Cost summary */}
      {projection.cost_summary ? (
        <div className="inner-card p-4">
          <div className="eyebrow text-muted">成本追踪</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-tertiary">预算</span>
              <div className="mt-0.5 font-semibold text-text">
                {projection.cost_summary.estimated_cost ? `¥${projection.cost_summary.estimated_cost}` : '--'}
              </div>
            </div>
            <div>
              <span className="text-tertiary">实际</span>
              <div className="mt-0.5 font-semibold text-accent">
                {projection.cost_summary.actual_cost ? `¥${projection.cost_summary.actual_cost}` : '--'}
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-tertiary">Token 消耗</span>
              <div className="mt-0.5 font-mono text-xs text-muted">
                {((projection.cost_summary.total_prompt_tokens ?? 0) + (projection.cost_summary.total_completion_tokens ?? 0)).toLocaleString()} tokens
                （提示 {(projection.cost_summary.total_prompt_tokens ?? 0).toLocaleString()} + 生成 {(projection.cost_summary.total_completion_tokens ?? 0).toLocaleString()}）
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
