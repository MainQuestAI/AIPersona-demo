import type {
  ComparePageData,
  DemoScenarioBundle,
  LibraryRecord,
  PlanApprovalEvent,
  PlanSummary,
  QualSessionEvent,
  ReplayData,
  RerunSuggestionPanelData,
  ResultPanelData,
  RunStep,
  TimelineStage,
  TimelineStep,
  TrustPanelData,
  TwinProfile,
  StudyPlanVersion,
  StudyRecord,
  StudyRun,
  MidrunReviewPanelData,
  RecommendationEvent,
  RerunSuggestionEvent,
  MidrunReviewEvent,
  AgentMessageEvent,
  StudyCompleteEvent as StudyCompleteEventType,
} from '@/types/demo';
import {
  DEMO_BASE_STUDY_META,
  DEMO_BENCHMARK_PACK,
  DEMO_BUSINESS_QUESTION,
  DEMO_CATEGORY,
  DEMO_DEFAULT_STATUS,
  DEMO_SCENARIO_IDS,
  DEMO_STUDY_ID,
  DEMO_STUDY_INPUTS_SNAPSHOT,
  DEMO_STUDY_NAME,
  DEMO_STUDY_TYPE,
  DEMO_STIMULI,
  DEMO_TARGET_GROUPS,
  DEMO_TWIN_SUBSET_LABELS,
} from '../scenario-meta';

const completedPlanSummary: PlanSummary = {
  studyType: DEMO_STUDY_TYPE,
  targetGroupCount: DEMO_TARGET_GROUPS.length,
  stimuliCount: DEMO_STIMULI.length,
  qualMode: 'AI IDI + 主题提取',
  quantMode: 'SSR 排序',
  estimatedRuntimeMin: 28,
  runtimeNote:
    'Qual 访谈在各 twin 子集上并行运行，因此端到端运行时间保持在 35 分钟以内。',
};

const completedTimelineStepStatus: Record<
  TimelineStage,
  TimelineStep['status']
> = {
  plan: 'done',
  approval: 'done',
  qual: 'done',
  midrun_review: 'done',
  quant: 'done',
  recommendation: 'current',
};

export const completedTimelineSteps: TimelineStep[] = [
  { id: 'plan', label: '计划', status: completedTimelineStepStatus.plan },
  {
    id: 'approval',
    label: '审批',
    status: completedTimelineStepStatus.approval,
  },
  { id: 'qual', label: '定性', status: completedTimelineStepStatus.qual },
  {
    id: 'midrun_review',
    label: '中途审批',
    status: completedTimelineStepStatus.midrun_review,
  },
  { id: 'quant', label: '定量', status: completedTimelineStepStatus.quant },
  {
    id: 'recommendation',
    label: '推荐',
    status: completedTimelineStepStatus.recommendation,
  },
];

export const completedRunSteps: RunStep[] = completedTimelineSteps.map((step) => ({
  id: `run-step-${step.id}`,
  studyRunId: 'study-run-bev-q4-001-001',
  stage: step.id,
  label: step.label,
  status: step.status,
}));

export const completedAgentMessageEvent: AgentMessageEvent = {
  id: 'event-agent-study-plan-ready',
  type: 'agent_message',
  title: '研究计划就绪',
  body: '我为 2 个目标人群和 3 个概念刺激物准备了研究计划。',
};

export const completedPlanApprovalEvent: PlanApprovalEvent = {
  id: 'event-plan-approval',
  type: 'plan_approval_card',
  summary: completedPlanSummary,
  primaryText:
    '我为 2 个目标人群和 3 个概念刺激物准备了研究计划。',
  secondaryText:
    '执行流程将先完成 AI 深度访谈、提取主题，然后请求审核，再继续进入 定量排序。',
  actions: ['批准计划', '请求修改', '查看计划详情'],
};

export const completedQualSessionEvent: QualSessionEvent = {
  id: 'event-qual-session',
  type: 'qual_session_card',
  runningOn: ['孕期女性', '新手妈妈'],
  completedSessionsLabel: '已完成访谈：3 / 6',
  completedSessionsNote: '已完成 3 场访谈。',
  emergingThemes: ['功能可信度', '情绪安全感'],
  helperText:
    '当前主题显示，清泉+ 在情绪安全感上领先，而初元优养则建立了更强的功能联想，但同时也带有更明显的医疗化色彩。',
  excerpts: [
    {
      speakerLabel: '孕期女性 · 一线城市 · 28岁',
      lines: [
        '这个名字让我觉得很干净，喝起来不会有负担。',
        '但我还是想知道成分细节，比如 DHA 含量到底是多少。',
        '我现在会特别在意这些。',
      ],
    },
    {
      speakerLabel: '宝宝妈妈 · 二线城市 · 31岁',
      lines: [
        '“清泉”这个感觉比较自然，不像那种专门强调功能的饮料。',
        '如果是我日常补水，我会更愿意先试这个。',
      ],
    },
    {
      speakerLabel: '孕期女性 · 一线城市 · 30岁',
      lines: [
        '“优养”听起来营养很好，但也让我有点像在看婴配粉或者营养补充品。',
        '我会想它是不是更适合特定阶段，而不是日常喝。',
      ],
    },
    {
      speakerLabel: '宝宝妈妈 · 一线城市 · 34岁',
      lines: [
        '这个名字不让人反感，也挺安全。',
        '但我听完不会立刻记住它，也不会特别想去了解更多。',
      ],
    },
  ],
};

export const completedMidrunReviewEvent: MidrunReviewEvent = {
  id: 'event-midrun-review',
  type: 'midrun_review_card',
  title: '中途审批',
  body: [
    '定性探索已经充分，可以继续推进。',
    '两个目标人群的主要主题已趋于稳定。',
    '是否继续进入 定量排序？',
  ],
  decisionSummary: '当前定性阶段已经形成足够稳定的判断信号，可以把资源投入到下一轮定量排序，而不是继续延长访谈。',
  metrics: [
    { label: '目标人群覆盖', value: '2 / 2 已覆盖', tone: 'positive' },
    { label: '访谈轮次', value: '6 轮已完成', tone: 'positive' },
    { label: '稳定主题', value: '2 个已浮现', tone: 'positive' },
    { label: '证据沉淀', value: '3 份中间产物', tone: 'neutral' },
  ],
  focusThemes: ['功能可信度', '情绪安全感'],
  recommendation: '建议继续进入定量排序；如果要调整刺激物范围，应在本节点暂停，而不是继续追加访谈。',
  actions: ['继续定量排序', '暂停编辑'],
};

export const completedRecommendationEvent: RecommendationEvent = {
  id: 'event-recommendation',
  type: 'recommendation_card',
  winner: '清泉+',
  confidence: '82 / 高',
  body:
    '清泉+ 在两个核心人群中都建立了更强的“安全感 + 日常饮用适配度”信号。“清”与“泉”的语义让受访 twin 更容易联想到天然、纯净、无负担的饮用体验，同时没有过强的医疗化压迫感。',
  actions: ['进入消费者验证', '探索"清"/"泉"命名边界'],
};

export const completedStudyCompleteEvent: StudyCompleteEventType = {
  id: 'event-study-complete',
  type: 'study_complete_card',
  title: '研究完成，推荐结论就绪。',
  body: [
    '本研究已完成定性探索、定量排序和综合分析。',
    '当前推荐结论可供审阅、导出或归档。',
  ],
  actions: ['查看回放', '下载报告', '归档到资产库'],
};

export const completedRerunSuggestionEvent: RerunSuggestionEvent = {
  id: 'event-rerun-suggested',
  type: 'rerun_suggestion_card',
  title: '建议重跑。',
  reason: [
    '新增孕产用户访谈录音后，Twin 集已更新。',
    '当前结果仍可使用，但基于刷新后的 Twin 版本重跑定量排序可提升置信度。',
  ],
  actions: ['查看变更', '启动重跑', '保留当前结果'],
};

export const completedMidrunReviewPanel: MidrunReviewPanelData = {
  title: '中途审批',
  body: [
    '定性探索已经充分，可以继续推进。',
    '两个目标人群的主要主题已趋于稳定。',
    '是否继续进入 定量排序？',
  ],
  decisionSummary: '当前定性阶段已经形成足够稳定的判断信号，可以把资源投入到下一轮定量排序，而不是继续延长访谈。',
  metrics: [
    { label: '目标人群覆盖', value: '2 / 2 已覆盖', tone: 'positive' },
    { label: '访谈轮次', value: '6 轮已完成', tone: 'positive' },
    { label: '稳定主题', value: '2 个已浮现', tone: 'positive' },
    { label: '证据沉淀', value: '3 份中间产物', tone: 'neutral' },
  ],
  focusThemes: ['功能可信度', '情绪安全感'],
  recommendation: '建议继续进入定量排序；如果要调整刺激物范围，应在本节点暂停，而不是继续追加访谈。',
  actions: ['继续定量排序', '暂停编辑'],
};

export const completedRerunSuggestionPanel: RerunSuggestionPanelData = {
  title: '建议重跑。',
  body: [
    '三周后，团队将 5 份新的孕产用户访谈录音导入了系统。',
    '系统检测到 twin set 发生了轻微更新，因此建议基于刷新后的 twin version 重新运行一次 quant ranking，以获得更新的置信度。',
  ],
  reason: [
    '新增孕产用户访谈录音后，Twin 集已更新。',
    '当前结果仍可使用，但基于刷新后的 Twin 版本重跑定量排序可提升置信度。',
  ],
  actions: ['查看变更', '启动重跑', '保留当前结果'],
};

export const completedResultPanel: ResultPanelData = {
  recommendation: {
    winner: '清泉+',
    confidenceLabel: '82 / 高',
    nextAction: '进入消费者验证',
    supportingText:
      '清泉+ 在两个核心人群中都建立了更强的“安全感 + 日常饮用适配度”信号。“清”与“泉”的语义让受访 twin 更容易联想到天然、纯净、无负担的饮用体验，同时没有过强的医疗化压迫感。',
  },
  ranking: [
    {
      stimulusId: 'qingquan-plus',
      label: '清泉+',
      score: 74,
      confidenceLabel: '82 / 高',
      confidenceLevel: 'high',
    },
    {
      stimulusId: 'chuyuan-youyang',
      label: '初元优养',
      score: 61,
      confidenceLabel: '82 / 高',
      confidenceLevel: 'high',
    },
    {
      stimulusId: 'anchun',
      label: '安纯',
      score: 52,
      confidenceLabel: '82 / 高',
      confidenceLevel: 'high',
    },
  ],
  qualThemes: [
    {
      stimulusId: 'qingquan-plus',
      label: '清泉+',
      themes: ['功能可信度', '情绪安全感', '场景代入'],
      summary: '更容易被理解为日常补水替代选择，不会被第一眼读成功能型饮品或医疗型产品。',
    },
    {
      stimulusId: 'chuyuan-youyang',
      label: '初元优养',
      themes: ['强化营养感', '医疗化门槛', '信任分化'],
      summary: '“优养”会让人联想到功能更完整、营养更足，但也更容易被质疑是不是太像配方产品。',
    },
    {
      stimulusId: 'anchun',
      label: '安纯',
      themes: ['低风险安全感', '缺乏记忆点', '功能表达不足'],
      summary: '名称本身不让人反感，也挺安全，但记不住，推进理由弱。',
    },
  ],
  segmentDifferences: [
    {
      segmentLabel: '孕期女性',
      strongestOption: '清泉+',
      keyDifference:
        '最看重安全感、成分透明度、不不过度刺激的日常适配性；对初元优养的疑虑最大。',
    },
    {
      segmentLabel: '0-3 岁宝宝妈妈',
      strongestOption: '清泉+',
      keyDifference:
        '对清泉+ 和 初元优养都能理解，但最终仍认为清泉+ 更轻松、更容易纳入日常。',
    },
  ],
};

export const completedConceptCompareView: ComparePageData = {
  headline: '清泉+ 是推荐推进的概念。',
  subheadline:
    '它在两个目标人群中结合了更强的情绪安全信号和更好的日常饮用适配度。',
  compareGrid: [
    {
      label: '清泉+',
      quantScore: 74,
      themeLabels: ['功能可信度', '情绪安全感', '场景代入'],
      summary: '更容易被理解为日常补水替代选择。',
    },
    {
      label: '初元优养',
      quantScore: 61,
      themeLabels: ['强化营养感', '医疗化门槛', '信任分化'],
      summary: '“优养”让部分受访者联想到配方粉或营养补充品。',
    },
    {
      label: '安纯',
      quantScore: 52,
      themeLabels: ['低风险安全感', '缺乏记忆点', '功能表达不足'],
      summary: '安全但不出彩，推进理由弱。',
    },
  ],
  ranking: [
    {
      stimulusId: 'qingquan-plus',
      label: '清泉+',
      score: 74,
      confidenceLabel: '82 / 高',
      confidenceLevel: 'high',
    },
    {
      stimulusId: 'chuyuan-youyang',
      label: '初元优养',
      score: 61,
      confidenceLabel: '82 / 高',
      confidenceLevel: 'high',
    },
    {
      stimulusId: 'anchun',
      label: '安纯',
      score: 52,
      confidenceLabel: '82 / 高',
      confidenceLevel: 'high',
    },
  ],
  segmentDifferences: [
    {
      segmentLabel: '孕期女性',
      strongestOption: '清泉+',
      keyDifference:
        '最看重安全感、成分透明度、不不过度刺激的日常适配性；对初元优养的疑虑最大。',
    },
    {
      segmentLabel: '0-3 岁宝宝妈妈',
      strongestOption: '清泉+',
      keyDifference:
        '对清泉+ 和 初元优养都能理解，但最终仍认为清泉+ 更轻松、更容易纳入日常。',
    },
  ],
  nextActionTitle: '为清泉+ 进入消费者验证',
  nextActionBody:
    '验证”清”与”泉”如何共同塑造信任感、纯净感和日常饮用适配度——通过真实消费者访谈。',
};

export const completedTwinCatalog: TwinProfile[] = [
  {
    id: 'pregnant-women-subset',
    name: '饮品 TA v2.1 / 孕期女性子集',
    builtFrom: '3 份定性报告 + 7 份访谈录音',
    ageRange: '25-35 / Tier-1 / 一线城市孕期女性',
    audienceLabel: '孕期女性',
    researchReadiness: ['概念筛选', '命名测试', 'KV 测试'],
    versionNotes:
      'v2.1 在 2025-Q3 更新后增加了对成分透明度的敏感度',
  },
  {
    id: 'new-mom-subset',
    name: '饮品 TA v2.1 / 新手妈妈子集',
    builtFrom: '2 份定性报告 + 5 份访谈录音',
    ageRange: '26-38 / Tier-1&2',
    audienceLabel: '新手妈妈',
    researchReadiness: ['概念筛选', '传播物测试'],
    versionNotes: 'v2.1 增加了日常使用场景信号',
  },
];

export const completedTrustPanel: TrustPanelData = {
  confidenceLabel: '82 / 高',
  benchmarkPack: DEMO_BENCHMARK_PACK,
  lastCalibration: '2026-03-18',
  approvalTrail: [
    '计划已批准',
    '中途审批已通过',
    '推荐结论就绪',
  ],
};

export const completedStudyReplay: ReplayData = {
  title: '饮品 TA v2.1 运行回放',
  stages: [
    {
      id: 'plan',
      label: '计划',
      inputs: ['商业问题', '目标人群', '刺激物'],
      outputs: ['已批准研究计划'],
      decisions: ['先做 Qual，审核后再进入 Quant'],
    },
    {
      id: 'qual',
      label: '定性',
      inputs: ['Twin 集', '概念刺激物'],
      outputs: ['主题', '典型摘录'],
      decisions: ['清泉+ 和 初元优养进入 Quant', '安纯保留但优先级下降'],
    },
    {
      id: 'quant',
      label: '定量',
      inputs: ['已审核主题', '锚定集'],
      outputs: ['排名', '细分差异'],
      decisions: ['清泉+ 为首推'],
    },
    {
      id: 'synthesis',
      label: '综合',
      inputs: ['定性主题', '定量排名'],
      outputs: ['推荐结论', '下一步行动', '审批轨迹'],
      decisions: ['进入消费者验证'],
    },
  ],
};

export const completedLibraryRecords: LibraryRecord[] = [
  {
    id: 'bev-concept-screening-qingquan',
    label: '饮品概念筛选 / 清泉+',
    type: '概念筛选',
  },
  {
    id: 'imf-naming-screening-xinghuayouqi',
    label: 'IMF 命名筛选 / 星护优启',
    type: '命名筛选',
  },
  {
    id: 'communication-asset-test-chenhushike',
    label: '传播物测试 / 晨护时刻',
    type: '传播物测试',
  },
];

export const completedStudyPlanVersion: StudyPlanVersion = {
  id: 'study-plan-version-bev-q4-001-v2-1',
  studyId: DEMO_STUDY_ID,
  versionLabel: 'v2.1',
  status: 'approved',
  summary: completedPlanSummary,
  selectedTwins: [...DEMO_TWIN_SUBSET_LABELS],
  selectedStimuli: [...DEMO_STIMULI],
  approvalRequired: true,
  lastUpdated: '2026-03-18',
};

export const completedStudyRun: StudyRun = {
  id: 'study-run-bev-q4-001-001',
  studyId: DEMO_STUDY_ID,
  studyPlanVersionId: completedStudyPlanVersion.id,
  status: DEMO_DEFAULT_STATUS,
  activeTimelineStage: 'recommendation',
  currentRunStepId: 'run-step-recommendation',
  runStepIds: completedRunSteps.map((step) => step.id),
  lastUpdated: '2026-03-18',
};

export const completedStudy: StudyRecord = {
  id: DEMO_STUDY_ID,
  scenarioId: DEMO_SCENARIO_IDS.completedRecommendation,
  studyName: DEMO_STUDY_NAME,
  category: DEMO_CATEGORY,
  studyType: DEMO_STUDY_TYPE,
  businessQuestion: DEMO_BUSINESS_QUESTION,
  status: DEMO_DEFAULT_STATUS,
  activeTimelineStage: 'recommendation',
};

export const completedRecommendationScenario = {
  meta: {
    scenarioId: DEMO_SCENARIO_IDS.completedRecommendation,
    ...DEMO_BASE_STUDY_META,
    status: DEMO_DEFAULT_STATUS,
    activeTimelineStage: 'recommendation',
  },
  study: completedStudy,
  inputsSnapshot: DEMO_STUDY_INPUTS_SNAPSHOT,
  studyPlanVersion: completedStudyPlanVersion,
  studyRun: completedStudyRun,
  timelineSteps: completedTimelineSteps,
  runSteps: completedRunSteps,
  currentSurfaceKey: 'resultPanel',
  conversationEvents: [
    completedAgentMessageEvent,
    completedPlanApprovalEvent,
    completedQualSessionEvent,
    completedMidrunReviewEvent,
    completedRecommendationEvent,
    completedStudyCompleteEvent,
  ],
  resultPanel: completedResultPanel,
  midrunReviewPanel: completedMidrunReviewPanel,
  rerunSuggestionPanel: completedRerunSuggestionPanel,
  compareView: completedConceptCompareView,
  twinCatalog: completedTwinCatalog,
  trustPanel: completedTrustPanel,
  replay: completedStudyReplay,
  libraryRecords: completedLibraryRecords,
} satisfies DemoScenarioBundle;
