import { useState } from 'react';
import type { DemoScenarioBundle } from '@/types/demo';
import type { WorkbenchProjection } from '@/app/services/studyRuntime';

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
    return (
      <section className="space-y-4">
        <div className="glass-panel glass-panel--action p-5">
          <div className="eyebrow text-action">研究执行中</div>
          <div className="mt-2 text-lg font-semibold tracking-[-0.02em] text-text">
            当前正在生成定性与定量结果
          </div>
          <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
            <p>研究已经进入运行阶段，系统会继续生成定性主题、量化排序和推荐结论。</p>
            <p>现在最适合查看输入源、孪生资产和可信度约束，先确认这次研究跑在正确轨道上。</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
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
    </section>
  );
}
