import type {
  ConversationEvent,
  DemoScenarioBundle,
  DemoScenarioId,
  MidrunReviewMetric,
  PlanSummary,
  RunStepStatus,
  TimelineStage,
  TimelineStep,
} from '@/types/demo';
import { getScenarioBundle } from '@/mocks/selectors';

import type { StudyDetailProjection, WorkbenchProjection } from './studyRuntime';

type RuntimePhase =
  | 'draft'
  | 'pending_approval'
  | 'ready_to_run'
  | 'running'
  | 'awaiting_midrun_review'
  | 'completed'
  | 'rerun_suggested';

const TIMELINE_ORDER: TimelineStage[] = [
  'plan',
  'approval',
  'qual',
  'midrun_review',
  'quant',
  'recommendation',
];

export type StudySessionBoardCard = {
  id: TimelineStage;
  label: string;
  status: RunStepStatus;
  eyebrow: string;
  headline: string;
  detail: string;
};

export type ExecutiveSummary = {
  headline: string;
  detail: string;
};

export type DecisionSnapshot = {
  headline: string;
  supportingText: string;
  confidenceLabel: string;
  nextAction: string;
  costLabel: string;
  tokenLabel: string;
  evidenceLabel: string;
};

export type EvidenceChainCard = {
  id: 'compare' | 'twins' | 'trust' | 'replay';
  label: string;
  headline: string;
  detail: string;
  ctaLabel: string;
};

function getRuntimePhase(projection: WorkbenchProjection): RuntimePhase {
  const runStatus = projection.current_run?.status;
  const approvalStatus = projection.latest_plan_version?.approval_status;

  if (runStatus === 'awaiting_midrun_approval') {
    return 'awaiting_midrun_review';
  }
  if (runStatus === 'paused_for_adjustment') {
    return 'awaiting_midrun_review';
  }
  if (runStatus === 'failed') {
    return 'rerun_suggested';
  }
  if (runStatus === 'succeeded' || projection.study.status === 'completed') {
    return 'completed';
  }
  if (runStatus === 'running' || runStatus === 'queued') {
    return 'running';
  }
  if (approvalStatus === 'pending_approval') {
    return 'pending_approval';
  }
  if (approvalStatus === 'approved') {
    return 'ready_to_run';
  }
  return 'draft';
}

function getLatestArtifact(
  projection: WorkbenchProjection,
  artifactType: string,
) {
  return [...(projection.artifacts ?? [])]
    .filter((artifact) => artifact.artifact_type === artifactType)
    .sort((left, right) => (left.created_at < right.created_at ? 1 : -1))[0];
}

function toConfidenceLevel(raw: unknown): 'high' | 'medium' | 'low' {
  if (raw === 'high' || raw === 'medium' || raw === 'low') {
    return raw;
  }
  return 'medium';
}

function formatStimulusLabel(
  projection: WorkbenchProjection,
  stimulusName: string,
  index: number,
): string {
  const matched = (projection.stimuli ?? []).find((stimulus) => stimulus.name === stimulusName);
  if (matched?.name) {
    return matched.name;
  }
  return stimulusName || `Concept ${index + 1}`;
}

function getCostSummary(
  projection: WorkbenchProjection,
): NonNullable<WorkbenchProjection['cost_summary']> | undefined {
  return projection.cost_summary
    ?? (projection as StudyDetailProjection).execution?.cost_summary;
}

function getArtifactCount(projection: WorkbenchProjection): number {
  return projection.artifacts?.length ?? 0;
}

function getTwinCount(projection: WorkbenchProjection): number {
  return projection.twins?.length ?? projection.latest_plan_version?.twin_count ?? 0;
}

function getStimulusCount(projection: WorkbenchProjection): number {
  return projection.stimuli?.length ?? projection.latest_plan_version?.stimulus_count ?? 0;
}

function formatTokenLabel(
  promptTokens: number | null | undefined,
  completionTokens: number | null | undefined,
): string {
  const total = Number(promptTokens ?? 0) + Number(completionTokens ?? 0);
  if (total <= 0) {
    return 'Token 成本待累计';
  }
  return `已消耗 ${total.toLocaleString('en-US')} tokens`;
}

function formatCostLabel(
  estimatedCost: string | null | undefined,
  actualCost: string | null | undefined,
): string {
  if (estimatedCost && actualCost) {
    return `预算 ${estimatedCost} / 实际 ${actualCost}`;
  }
  if (estimatedCost) {
    return `预算 ${estimatedCost}`;
  }
  if (actualCost) {
    return `实际 ${actualCost}`;
  }
  return '成本待核算';
}

function formatCoverageLabel(count: number): string {
  if (count <= 0) {
    return '待补充';
  }
  return `${count} / ${count} 已覆盖`;
}

function buildMidrunReviewSupport(
  projection: WorkbenchProjection,
  fallback: {
    title: string;
    body: string[];
    actions: string[];
    focusThemes?: string[];
    decisionSummary?: string;
    recommendation?: string;
  },
) {
  const qualArtifact = getLatestArtifact(projection, 'qual_transcript');
  const qualManifest = (qualArtifact?.manifest ?? {}) as Record<string, any>;
  const twinCount = getTwinCount(projection);
  const stimulusCount = getStimulusCount(projection);
  const artifactCount = getArtifactCount(projection);
  const themeLabels = Array.isArray(qualManifest.themes?.themes)
    ? qualManifest.themes.themes.map(String)
    : (fallback.focusThemes ?? []);
  const sessionCount = Array.isArray(qualManifest.interviews)
    ? qualManifest.interviews.length
    : twinCount > 0 && stimulusCount > 0
      ? twinCount * stimulusCount
      : 0;
  const stableThemeCount = themeLabels.length;
  const resolvedGroupCount = twinCount || projection.study.target_groups?.length || 0;
  const metrics: MidrunReviewMetric[] = [
    {
      label: '目标人群覆盖',
      value: formatCoverageLabel(resolvedGroupCount),
      tone: resolvedGroupCount > 0 ? 'positive' : 'warning',
    },
    {
      label: '访谈轮次',
      value: sessionCount > 0 ? `${sessionCount} 轮已完成` : '待累计',
      tone: sessionCount > 0 ? 'positive' : 'warning',
    },
    {
      label: '稳定主题',
      value: stableThemeCount > 0 ? `${stableThemeCount} 个已浮现` : '待形成',
      tone: stableThemeCount > 0 ? 'positive' : 'warning',
    },
    {
      label: '证据沉淀',
      value: artifactCount > 0 ? `${artifactCount} 份中间产物` : '待沉淀',
      tone: artifactCount > 0 ? 'neutral' : 'warning',
    },
  ];

  return {
    title: fallback.title,
    body: stableThemeCount > 0
      ? [
          `当前定性探索已覆盖 ${resolvedGroupCount || '全部'} 个目标人群，并围绕 ${stimulusCount || '当前'} 个刺激物形成稳定主题。`,
          '现在继续追加访谈的边际价值已经下降，更适合进入定量排序验证强弱差异。',
          '如果要缩减或替换刺激物，应在本节点暂停，而不是继续推进。',
        ]
      : fallback.body,
    decisionSummary: fallback.decisionSummary
      ?? `当前定性阶段已经形成可执行判断，建议在此节点做进入定量排序的业务决策，而不是继续延长探索。`,
    metrics,
    focusThemes: themeLabels.slice(0, 4),
    recommendation: fallback.recommendation
      ?? '建议继续进入定量排序；如果需要改刺激物或目标人群，先在本节点暂停并调整计划。',
    actions: fallback.actions,
  };
}

function enrichScenarioForProjection(
  projection: WorkbenchProjection,
  scenario: DemoScenarioBundle,
): DemoScenarioBundle {
  const midrunFallback = scenario.midrunReviewPanel;
  const enrichedEvents = scenario.conversationEvents.map((event) => {
    if (event.type !== 'midrun_review_card') {
      return event;
    }
    return {
      ...event,
      ...buildMidrunReviewSupport(projection, event),
    };
  });

  return {
    ...scenario,
    conversationEvents: enrichedEvents,
    midrunReviewPanel: midrunFallback
      ? {
          ...midrunFallback,
          ...buildMidrunReviewSupport(projection, midrunFallback),
        }
      : undefined,
  };
}

function buildConversationEventsFromArtifacts(
  projection: WorkbenchProjection,
): ConversationEvent[] | null {
  const phase = getRuntimePhase(projection);
  const planVersion = projection.latest_plan_version;
  const events: ConversationEvent[] = [];

  // 1. Agent message: plan ready
  if (planVersion) {
    events.push({
      id: 'artifact-event-plan-ready',
      type: 'agent_message',
      title: '研究计划就绪',
      body: `我为 ${planVersion.twin_count ?? 0} 个目标人群和 ${planVersion.stimulus_count ?? 0} 个概念刺激物准备了研究计划。`,
    });
  }

  // 2. Plan approval card
  if (planVersion) {
    const summary: PlanSummary = {
      studyType: String(projection.study.study_type ?? '概念筛选'),
      targetGroupCount: planVersion.twin_count ?? 0,
      stimuliCount: planVersion.stimulus_count ?? 0,
      qualMode: 'AI IDI + 主题提取',
      quantMode: 'SSR 排序',
      estimatedRuntimeMin: 28,
      runtimeNote: '定性访谈在各 twin 子集上并行运行。',
    };
    events.push({
      id: 'artifact-event-plan-approval',
      type: 'plan_approval_card',
      summary,
      primaryText: `已为 ${planVersion.twin_count ?? 0} 个人群和 ${planVersion.stimulus_count ?? 0} 个刺激物生成计划。`,
      secondaryText: '执行流程将先完成 AI 深度访谈、提取主题，然后请求审核，再继续进入定量排序。',
      actions: ['批准计划', '请求修改', '查看计划详情'],
    });
  }
  if (phase === 'draft' || phase === 'pending_approval' || phase === 'ready_to_run') {
    return events.length > 0 ? events : null;
  }

  // 3. Qual session card (from qual_transcript artifact)
  const qualArtifact = getLatestArtifact(projection, 'qual_transcript');
  if (qualArtifact) {
    const manifest = qualArtifact.manifest as Record<string, any>;
    const themes = manifest.themes ?? {};
    const interviews: Array<Record<string, any>> = Array.isArray(manifest.interviews) ? manifest.interviews : [];
    const twinNames = [...new Set(interviews.map((i) => String(i.twin_name ?? '未知')))];
    const excerpts = interviews.slice(0, 4).map((interview) => {
      const transcript = Array.isArray(interview.transcript) ? interview.transcript : [];
      if (transcript.length > 0) {
        return {
          speakerLabel: String(interview.twin_name ?? '受访者'),
          lines: (transcript as Array<Record<string, unknown>>)
            .filter((t) => t.role === 'respondent')
            .flatMap((t) => String(t.content ?? '').split('\n').filter(Boolean).slice(0, 2)),
        };
      }
      return {
        speakerLabel: String(interview.twin_name ?? '受访者'),
        lines: String(interview.response ?? '').split('\n').filter(Boolean).slice(0, 3),
      };
    });
    events.push({
      id: 'artifact-event-qual-session',
      type: 'qual_session_card',
      runningOn: twinNames,
      completedSessionsLabel: `已完成访谈：${interviews.length} / ${interviews.length}`,
      completedSessionsNote: `已完成 ${interviews.length} 场 AI 深度访谈。`,
      emergingThemes: Array.isArray(themes.themes) ? themes.themes.slice(0, 4).map(String) : [],
      helperText: String(themes.overall_insight ?? ''),
      excerpts,
    });
  }
  if (phase === 'running') {
    return events.length > 0 ? events : null;
  }

  // 4. Midrun review card (from qual artifact data)
  if (qualArtifact) {
    const manifest = qualArtifact.manifest as Record<string, any>;
    const themes = manifest.themes ?? {};
    const interviews: Array<Record<string, any>> = Array.isArray(manifest.interviews) ? manifest.interviews : [];
    const twinCount = Number(manifest.twin_count ?? 0);
    const themeLabels = Array.isArray(themes.themes) ? themes.themes.map(String) : [];
    events.push({
      id: 'artifact-event-midrun-review',
      type: 'midrun_review_card',
      title: '中途审批',
      body: [
        '定性探索已经充分，可以继续推进。',
        `${twinCount} 个目标人群的主要主题已趋于稳定。`,
        '是否继续进入定量排序？',
      ],
      decisionSummary: String(themes.overall_insight ?? '定性阶段已形成稳定判断信号。'),
      metrics: [
        { label: '目标人群覆盖', value: formatCoverageLabel(twinCount), tone: twinCount > 0 ? 'positive' : 'warning' },
        { label: '访谈轮次', value: `${interviews.length} 轮已完成`, tone: interviews.length > 0 ? 'positive' : 'warning' },
        { label: '稳定主题', value: `${themeLabels.length} 个已浮现`, tone: themeLabels.length > 0 ? 'positive' : 'warning' },
        { label: '证据沉淀', value: `${getArtifactCount(projection)} 份中间产物`, tone: 'neutral' },
      ],
      focusThemes: themeLabels.slice(0, 4),
      recommendation: '建议继续进入定量排序。',
      actions: ['继续定量排序', '暂停编辑'],
    });
  }
  if (phase === 'awaiting_midrun_review') {
    return events.length > 0 ? events : null;
  }

  // 5. Recommendation card (from recommendation artifact)
  const recArtifact = getLatestArtifact(projection, 'recommendation');
  if (recArtifact) {
    const manifest = recArtifact.manifest as Record<string, any>;
    events.push({
      id: 'artifact-event-recommendation',
      type: 'recommendation_card',
      winner: String(manifest.winner ?? '待确认'),
      confidence: String(manifest.confidence_label ?? '-- / 中'),
      body: String(manifest.supporting_text ?? ''),
      actions: ['进入消费者验证', '查看详细对比'],
    });
  }

  // 6. Study complete card
  if (phase === 'completed') {
    events.push({
      id: 'artifact-event-study-complete',
      type: 'study_complete_card',
      title: '研究完成，推荐结论就绪。',
      body: [
        '本研究已完成定性探索、定量排序和综合分析。',
        '当前推荐结论可供审阅、导出或归档。',
      ],
      actions: ['查看回放', '下载报告', '归档到资产库'],
    });
  }

  return events.length > 0 ? events : null;
}

function buildArtifactScenarioBundle(
  projection: StudyDetailProjection,
): DemoScenarioBundle | null {
  const qualArtifact = getLatestArtifact(projection, 'qual_transcript');
  const quantArtifact = getLatestArtifact(projection, 'quant_ranking');
  const recommendationArtifact = getLatestArtifact(projection, 'recommendation');

  if (!quantArtifact && !recommendationArtifact && !qualArtifact) {
    return null;
  }

  const fallback = getScenarioBundle(selectScenarioIdForProjection(projection));
  const qualManifest = (qualArtifact?.manifest ?? {}) as Record<string, any>;
  const quantManifest = (quantArtifact?.manifest ?? {}) as Record<string, any>;
  const recommendationManifest = (recommendationArtifact?.manifest ?? {}) as Record<string, any>;
  const replayManifest = ((projection as StudyDetailProjection).insights?.replay ?? {}) as Record<string, any>;
  const ranking = Array.isArray(quantManifest.ranking) ? quantManifest.ranking : [];
  const themeMap = Array.isArray(qualManifest.themes?.per_stimulus) ? qualManifest.themes.per_stimulus : [];
  const resultRanking = ranking.map((item: Record<string, any>, index: number) => ({
    stimulusId: String(item.stimulus_name ?? `stimulus-${index + 1}`),
    label: formatStimulusLabel(projection, String(item.stimulus_name ?? ''), index),
    score: Number(item.score ?? 0),
    confidenceLabel: String(item.confidence_label ?? '-- / 中'),
    confidenceLevel: toConfidenceLevel(item.confidence ?? 'medium'),
  }));
  const qualThemes = themeMap.map((item: Record<string, any>, index: number) => ({
    stimulusId: String(item.stimulus_name ?? `stimulus-${index + 1}`),
    label: formatStimulusLabel(projection, String(item.stimulus_name ?? ''), index),
    themes: Array.isArray(item.themes) ? item.themes.map(String) : [],
    summary: String(item.summary ?? ''),
  }));
  const segmentDifferences = Array.isArray(recommendationManifest.segment_differences)
    ? recommendationManifest.segment_differences.map((item: Record<string, any>) => ({
        segmentLabel: String(item.segment ?? '目标人群'),
        strongestOption: String(item.preference ?? recommendationManifest.winner ?? '待确认'),
        keyDifference: String(item.reason ?? ''),
      }))
    : fallback.resultPanel.segmentDifferences;
  const selectedStimuli = (projection.stimuli ?? []).map((stimulus) => stimulus.name);
  const mappedTwinCatalog = (projection.twins ?? []).map((twin, index) => {
      const snapshot = twin.persona_profile_snapshot_json ?? {};
      return {
        id: twin.id,
        name: String(snapshot.name ?? `Twin ${index + 1}`),
        builtFrom: String(snapshot.built_from ?? 'Seed Asset Pack'),
        ageRange: String(snapshot.age_range ?? twin.target_audience_label ?? '待补充'),
        audienceLabel: String(snapshot.audience_label ?? twin.target_audience_label ?? '目标人群'),
        researchReadiness: Array.isArray(snapshot.research_readiness)
          ? snapshot.research_readiness.map(String)
          : ['概念筛选'],
        versionNotes: String(snapshot.version_notes ?? '当前版本为 Seed Asset Pack 基线版本'),
      };
    });
  const twinCatalog = projection.twins === undefined ? fallback.twinCatalog : mappedTwinCatalog;
  const approvalTrail = [
    projection.latest_plan_version?.approval_status,
    projection.current_run?.approval_status,
  ].filter(Boolean).map((item) => String(item));

  return {
    ...fallback,
    meta: {
      ...fallback.meta,
      studyId: projection.study.id,
      studyName: projection.study.business_question || fallback.meta.studyName,
      businessQuestion: projection.study.business_question || fallback.meta.businessQuestion,
    },
    study: {
      ...fallback.study,
      id: projection.study.id,
      studyName: projection.study.business_question || fallback.study.studyName,
      businessQuestion: projection.study.business_question || fallback.study.businessQuestion,
    },
    inputsSnapshot: {
      consumerTwinsLabel: `${projection.latest_plan_version?.twin_count ?? projection.twins?.length ?? 0} 个数字孪生`,
      builtFrom: `${projection.twins?.length ?? 0} 个 Twin Version + ${projection.stimuli?.length ?? 0} 个 Stimulus`,
      benchmarkPack: 'Seed Asset Pack',
      lastUpdated: projection.current_run?.updated_at ?? projection.latest_plan_version?.created_at ?? '--',
    },
    studyPlanVersion: {
      ...fallback.studyPlanVersion,
      id: projection.latest_plan_version?.id ?? fallback.studyPlanVersion.id,
      studyId: projection.study.id,
      versionLabel: projection.latest_plan_version?.version_no ? `v${projection.latest_plan_version.version_no}` : fallback.studyPlanVersion.versionLabel,
      selectedTwins: twinCatalog.map((item) => item.name),
      selectedStimuli: selectedStimuli.length > 0 ? selectedStimuli : fallback.studyPlanVersion.selectedStimuli,
      approvalRequired: projection.latest_plan_version?.approval_required ?? fallback.studyPlanVersion.approvalRequired,
      lastUpdated: projection.latest_plan_version?.created_at ?? fallback.studyPlanVersion.lastUpdated,
    },
    resultPanel: {
      recommendation: {
        winner: String(recommendationManifest.winner ?? fallback.resultPanel.recommendation.winner),
        confidenceLabel: String(
          recommendationManifest.confidence_label ?? fallback.resultPanel.recommendation.confidenceLabel,
        ),
        nextAction: String(recommendationManifest.next_action ?? fallback.resultPanel.recommendation.nextAction),
        supportingText: String(
          recommendationManifest.supporting_text ?? fallback.resultPanel.recommendation.supportingText,
        ),
      },
      ranking: resultRanking.length > 0 ? resultRanking : fallback.resultPanel.ranking,
      qualThemes: qualThemes.length > 0 ? qualThemes : fallback.resultPanel.qualThemes,
      segmentDifferences,
    },
    compareView: {
      headline: `${String(recommendationManifest.winner ?? fallback.resultPanel.recommendation.winner)} 是当前最值得推进的方案。`,
      subheadline: String(
        recommendationManifest.supporting_text ?? fallback.compareView.subheadline,
      ),
      compareGrid: (resultRanking.length > 0 ? resultRanking : fallback.resultPanel.ranking).map((item) => ({
        label: item.label,
        quantScore: item.score,
        themeLabels:
          qualThemes.find((group: { label: string }) => group.label === item.label)?.themes ??
          fallback.compareView.compareGrid.find((group: { label: string }) => group.label === item.label)?.themeLabels ??
          [],
        summary:
          qualThemes.find((group: { label: string }) => group.label === item.label)?.summary ??
          fallback.compareView.compareGrid.find((group: { label: string }) => group.label === item.label)?.summary ??
          '',
      })),
      ranking: resultRanking.length > 0 ? resultRanking : fallback.compareView.ranking,
      segmentDifferences,
      nextActionTitle: String(recommendationManifest.next_action ?? fallback.compareView.nextActionTitle),
      nextActionBody: String(recommendationManifest.supporting_text ?? fallback.compareView.nextActionBody),
    },
    twinCatalog,
    trustPanel: {
      confidenceLabel: String(
        recommendationManifest.confidence_label ?? fallback.trustPanel.confidenceLabel,
      ),
      benchmarkPack: 'Seed Asset Pack',
      lastCalibration:
        projection.current_run?.updated_at ??
        projection.latest_plan_version?.created_at ??
        fallback.trustPanel.lastCalibration,
      approvalTrail: approvalTrail.length > 0 ? approvalTrail : fallback.trustPanel.approvalTrail,
      methodology: [
        '定性主题来自已完成 AI IDI 访谈的结构化抽取。',
        '定量排序基于同一批刺激物在目标人群中的量化评分。',
        '推荐结论综合排序、主题和人群差异生成。',
      ],
      evidenceCoverage: [
        `${getTwinCount(projection)} 个孪生版本参与评估`,
        `${getStimulusCount(projection)} 个刺激物进入排序`,
        `${getArtifactCount(projection)} 份关键产物已沉淀`,
      ],
      costNote: formatCostLabel(
        projection.cost_summary?.estimated_cost ?? (projection as StudyDetailProjection).execution?.cost_summary?.estimated_cost,
        projection.cost_summary?.actual_cost ?? (projection as StudyDetailProjection).execution?.cost_summary?.actual_cost,
      ),
      recommendedAction: String(
        recommendationManifest.next_action ?? fallback.resultPanel.recommendation.nextAction,
      ),
    },
    replay: {
      title: String(replayManifest.title ?? fallback.replay.title),
      summary: String(
        recommendationManifest.supporting_text ?? fallback.resultPanel.recommendation.supportingText,
      ),
      nextAction: String(
        recommendationManifest.next_action ?? fallback.resultPanel.recommendation.nextAction,
      ),
      stages: Array.isArray(replayManifest.stages) && replayManifest.stages.length > 0
        ? replayManifest.stages.map((stage: Record<string, any>) => ({
            id: String(stage.id ?? 'plan') as any,
            label: String(stage.label ?? '阶段'),
            inputs: Array.isArray(stage.inputs) ? stage.inputs.map(String) : [],
            outputs: Array.isArray(stage.outputs) ? stage.outputs.map(String) : [],
            decisions: Array.isArray(stage.decisions) ? stage.decisions.map(String) : [],
          }))
        : fallback.replay.stages,
    },
    libraryRecords:
      projection.stimuli === undefined
        ? fallback.libraryRecords
        : (projection.stimuli ?? []).map((stimulus) => ({
        id: stimulus.id,
        label: stimulus.name,
        type: stimulus.stimulus_type ?? 'concept',
      })),
  };
}

function formatCountLabel(count: number | null | undefined, noun: string): string {
  return `${count ?? 0} ${noun}`;
}

function buildStageCopy(
  projection: WorkbenchProjection,
  stageId: TimelineStage,
): Omit<StudySessionBoardCard, 'id' | 'label' | 'status'> {
  const latestPlanVersion = projection.latest_plan_version;
  const runStatus = projection.current_run?.status;
  const approvalStatus = latestPlanVersion?.approval_status;
  const stimuliLabel = formatCountLabel(latestPlanVersion?.stimulus_count, '个刺激物');
  const twinsLabel = formatCountLabel(latestPlanVersion?.twin_count, '个孪生');

  switch (stageId) {
    case 'plan':
      return {
        eyebrow: '研究计划',
        headline: latestPlanVersion
          ? `已锁定 ${stimuliLabel} 与 ${twinsLabel}`
          : '尚未创建研究计划',
        detail: latestPlanVersion
          ? '研究计划已锁定目标人群、刺激物和执行参数，可提交审批。'
          : '请先创建研究计划，确定目标人群和刺激物范围。',
      };
    case 'approval':
      if (approvalStatus === 'draft') {
        return {
          eyebrow: '审批',
          headline: '研究计划待提交',
          detail: '计划编辑完成后，请提交审批以锁定执行版本。',
        };
      }
      if (approvalStatus === 'pending_approval') {
        return {
          eyebrow: '审批',
          headline: '等待审批确认',
          detail: '研究计划已提交，等待负责人确认后启动执行。',
        };
      }
      return {
        eyebrow: '审批',
        headline: '审批已通过',
        detail: '审批已通过，研究计划已锁定为执行版本。',
      };
    case 'qual':
      if (!projection.current_run) {
        return {
          eyebrow: '定性研究',
          headline: '待启动',
          detail: '研究启动后将自动执行 AI 定性访谈。',
        };
      }
      if (runStatus === 'running') {
        return {
          eyebrow: '定性研究',
          headline: '访谈进行中',
          detail: 'AI 定性访谈正在进行，主题正在逐步形成。',
        };
      }
      return {
        eyebrow: '定性研究',
        headline: '定性主题已提取',
        detail: '定性访谈已完成，主要主题和消费者洞察已生成。',
      };
    case 'midrun_review':
      if (runStatus === 'awaiting_midrun_approval') {
        return {
          eyebrow: '中途审核',
          headline: '等待审核确认',
          detail: '定性阶段已完成，需审核确认后继续进入定量排序。',
        };
      }
      if (projection.current_run) {
        return {
          eyebrow: '中途审核',
          headline: '审核已通过',
          detail: '中途审核已通过，研究继续推进至定量排序阶段。',
        };
      }
      return {
        eyebrow: '中途审核',
        headline: '待触发',
        detail: '定性执行完成后将自动进入中途审核节点。',
      };
    case 'quant':
      if (!projection.current_run) {
        return {
          eyebrow: '定量排序',
          headline: '待启动',
          detail: '定量排序将在中途审核通过后自动启动。',
        };
      }
      if (runStatus === 'failed') {
        return {
          eyebrow: '定量排序',
          headline: '执行异常',
          detail: '定量排序过程中发现异常，建议检查配置后重新执行。',
        };
      }
      if (runStatus === 'succeeded' || projection.study.status === 'completed') {
        return {
          eyebrow: 'AI 综合评估',
          headline: '多轮评分已完成',
          detail: '多轮独立评分已完成，排名结果和置信度区间已生成。',
        };
      }
      return {
        eyebrow: '定量排序',
        headline: '等待中途审核',
        detail: '定量排序将在中途审核通过后自动启动。',
      };
    case 'recommendation':
    default:
      if (runStatus === 'failed') {
        return {
          eyebrow: '推荐结论',
          headline: '建议重新执行',
          detail: '当前数据不足以生成可靠推荐，建议调整配置后重新执行。',
        };
      }
      if (runStatus === 'succeeded' || projection.study.status === 'completed') {
        return {
          eyebrow: '推荐结论',
          headline: '推荐结论已生成',
          detail: '推荐结论已生成，可进行详细对比分析或导出报告。',
        };
      }
      return {
        eyebrow: '推荐结论',
        headline: '等待研究完成',
        detail: '推荐结论将在全部研究阶段完成后自动生成。',
      };
  }
}

function selectScenarioIdForProjection(
  projection: WorkbenchProjection,
): DemoScenarioId {
  const phase = getRuntimePhase(projection);
  if (phase === 'awaiting_midrun_review') {
    return 'awaiting-midrun-review';
  }
  if (phase === 'rerun_suggested') {
    return 'rerun-suggested';
  }
  return 'completed-recommendation';
}


export function buildSetupBarData(projection: WorkbenchProjection) {
  const scenario = getPitchScenarioBundle(projection);
  return {
    consumerTwinsLabel: `${getTwinCount(projection)} 个数字孪生`,
    builtFrom: `${projection.twins?.length ?? 0} 个 Twin + ${projection.stimuli?.length ?? 0} 个 Stimulus`,
    benchmarkPack: scenario.trustPanel.benchmarkPack,
    lastUpdated: projection.current_run?.updated_at ?? projection.latest_plan_version?.created_at ?? '--',
    stimulusLabels: (projection.stimuli ?? []).map((s) => s.name),
    stimulusScope: `${getStimulusCount(projection)} 个刺激物`,
    stimulusExpansionNote: '',
  };
}

export function buildPromptSuggestions(
  projection: WorkbenchProjection,
): string[] {
  const phase = getRuntimePhase(projection);
  const twinCount = projection.latest_plan_version?.twin_count ?? projection.twins?.length ?? 0;
  const stimulusCount = projection.latest_plan_version?.stimulus_count ?? projection.stimuli?.length ?? 0;
  const targetGroupCount = projection.study.target_groups?.length ?? 0;

  switch (phase) {
    case 'draft':
      return [
        `检查当前计划是否覆盖 ${targetGroupCount} 个目标人群`,
        `确认 ${stimulusCount} 个刺激物与 ${twinCount} 个数字孪生的绑定关系`,
        '准备提交审批',
      ];
    case 'pending_approval':
      return [
        '确认计划是否满足审批条件',
        '检查预估成本与目标人群配置',
        '批准计划并启动研究',
      ];
    case 'ready_to_run':
      return [
        '确认执行版本已锁定',
        '启动定性定量研究',
        '了解中途审核机制',
      ];
    case 'awaiting_midrun_review':
      return [
        '检查定性主题是否已经稳定',
        '批准后继续进入定量排序',
        '如果需要调整刺激物，先暂停当前研究',
      ];
    case 'rerun_suggested':
      return [
        '确认重跑是否需要复用已有定性输出',
        '检查孪生版本是否已更新',
        '决定重跑还是保留当前结果',
      ];
    case 'running':
      return [
        '观察当前研究是否在按计划推进',
        '确认下一审批点是否已定义',
        '准备结果解读框架',
      ];
    case 'completed':
    default:
      return [
        '查看推荐结论和置信度评估',
        '打开对比视图查看刺激物差异',
        '查看研究回放和可信度证据',
      ];
  }
}

export function buildStudySessionBoard(
  projection: WorkbenchProjection,
): StudySessionBoardCard[] {
  const timelineSteps = buildTimelineStepsForProjection(projection);

  return timelineSteps.map((step) => ({
    id: step.id,
    label: step.label,
    status: step.status,
    ...buildStageCopy(projection, step.id),
  }));
}

export function buildExecutiveSummaryForProjection(
  projection: WorkbenchProjection,
): ExecutiveSummary {
  const phase = getRuntimePhase(projection);

  switch (phase) {
    case 'draft':
      return {
        headline: '研究计划编辑中',
        detail: '请确认目标人群、刺激物和研究参数后提交审批。',
      };
    case 'pending_approval':
      return {
        headline: '等待审批确认',
        detail: '研究计划已提交，等待负责人审批后启动执行。',
      };
    case 'ready_to_run':
      return {
        headline: '审批已通过，可启动研究',
        detail: '研究计划已锁定为执行版本，可以启动定性定量研究流程。',
      };
    case 'running':
      return {
        headline: '研究执行中',
        detail: '定性访谈正在进行，完成后将进入中途审核节点。',
      };
    case 'awaiting_midrun_review':
      return {
        headline: '等待中途审核',
        detail: '定性阶段已完成，请审核主题结果后确认是否继续定量排序。',
      };
    case 'rerun_suggested':
      return {
        headline: '建议重新执行',
        detail: '检测到数据变更或置信度不足，建议更新配置后重新执行。',
      };
    case 'completed':
    default:
      return {
        headline: '研究已完成',
        detail: '推荐结论已生成，可查看详细对比、数字孪生溯源或导出报告。',
      };
  }
}

export function buildDecisionSnapshotForProjection(
  projection: WorkbenchProjection,
): DecisionSnapshot {
  const scenario = getPitchScenarioBundle(projection);
  const recommendation = scenario.resultPanel.recommendation;
  const costSummary = getCostSummary(projection);

  return {
    headline: `建议推进 ${recommendation.winner}`,
    supportingText: recommendation.supportingText,
    confidenceLabel: recommendation.confidenceLabel,
    nextAction: recommendation.nextAction,
    costLabel: formatCostLabel(costSummary?.estimated_cost, costSummary?.actual_cost),
    tokenLabel: formatTokenLabel(
      costSummary?.total_prompt_tokens,
      costSummary?.total_completion_tokens,
    ),
    evidenceLabel: `${getTwinCount(projection)} 个孪生 · ${getStimulusCount(projection)} 个刺激物 · ${getArtifactCount(projection)} 份关键产物`,
  };
}

export function buildEvidenceChainCardsForProjection(
  projection: WorkbenchProjection,
): EvidenceChainCard[] {
  const scenario = getPitchScenarioBundle(projection);
  const recommendation = scenario.resultPanel.recommendation;
  const confidenceLabel = scenario.trustPanel.confidenceLabel;

  return [
    {
      id: 'compare',
      label: '差异解释',
      headline: `解释${recommendation.winner}为什么赢`,
      detail: '先看排序、定性主题和人群差异，解释这条推荐背后的业务原因。',
      ctaLabel: '打开概念对比',
    },
    {
      id: 'twins',
      label: '来源证明',
      headline: '确认结论来自哪些孪生',
      detail: `查看 ${getTwinCount(projection)} 个孪生版本的来源、版本说明和适用场景。`,
      ctaLabel: '查看孪生来源',
    },
    {
      id: 'trust',
      label: '可信度',
      headline: '确认这条推荐是否可信',
      detail: `查看置信度 ${confidenceLabel}、审批轨迹和方法说明，判断是否能进入下一步。`,
      ctaLabel: '打开可信度说明',
    },
    {
      id: 'replay',
      label: '过程回放',
      headline: '回放这条结论如何形成',
      detail: '从计划、定性、定量到推荐，按阶段回看这次研究如何收敛到最终结论。',
      ctaLabel: '查看研究回放',
    },
  ];
}

function buildTimelineStepsForProjection(
  projection: WorkbenchProjection,
): TimelineStep[] {
  const scenario = getScenarioBundle(selectScenarioIdForProjection(projection));
  const phase = getRuntimePhase(projection);

  if (phase === 'awaiting_midrun_review' || phase === 'completed' || phase === 'rerun_suggested') {
    return scenario.timelineSteps;
  }

  let currentStage: TimelineStage = 'plan';
  if (phase === 'pending_approval') {
    currentStage = 'approval';
  } else if (phase === 'running') {
    currentStage = 'qual';
  }

  return TIMELINE_ORDER.map((stage) => {
    if (stage === currentStage) {
      return { id: stage, label: scenario.timelineSteps.find((item) => item.id === stage)?.label ?? stage, status: 'current' };
    }
    const isDone = TIMELINE_ORDER.indexOf(stage) < TIMELINE_ORDER.indexOf(currentStage);
    return {
      id: stage,
      label: scenario.timelineSteps.find((item) => item.id === stage)?.label ?? stage,
      status: isDone ? 'done' : 'upcoming',
    };
  });
}

export function buildConversationEventsForProjection(
  projection: WorkbenchProjection,
): ConversationEvent[] {
  // Prefer artifact-based events when available
  const artifactEvents = buildConversationEventsFromArtifacts(projection);
  if (artifactEvents && artifactEvents.length > 0) {
    return artifactEvents;
  }

  // Fallback: slice mock scenario events by phase
  const phase = getRuntimePhase(projection);
  const scenario = getPitchScenarioBundle(projection);

  if (phase === 'draft' || phase === 'pending_approval' || phase === 'ready_to_run') {
    return scenario.conversationEvents.slice(0, 2);
  }
  if (phase === 'running') {
    return scenario.conversationEvents.slice(0, 3);
  }
  if (phase === 'awaiting_midrun_review') {
    return scenario.conversationEvents.slice(0, 4);
  }
  if (phase === 'completed') {
    return scenario.conversationEvents.slice(0, 6);
  }
  return scenario.conversationEvents;
}

export function getPitchScenarioBundle(
  projection: WorkbenchProjection,
): DemoScenarioBundle {
  const artifactBundle = buildArtifactScenarioBundle(projection as StudyDetailProjection);
  if (artifactBundle) {
    return enrichScenarioForProjection(projection, artifactBundle);
  }
  // Fallback: use mock scenario for structural completeness.
  // Mark as mock so the UI can distinguish from real data.
  const fallback = getScenarioBundle(selectScenarioIdForProjection(projection));
  const enriched = enrichScenarioForProjection(projection, fallback);
  enriched._isMockData = true;
  return enriched;
}
