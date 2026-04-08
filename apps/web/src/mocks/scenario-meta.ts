import type { DemoScenarioId, DemoScenarioMeta, StudyInputsSnapshot } from '@/types/demo';

export const DEMO_STUDY_ID = 'study-bev-q4-001';

export const DEMO_STUDY_NAME =
  '孕期饮品概念筛选 · Beverage TA v2.1 · 2025-Q4';

export const DEMO_CATEGORY = '饮品';

export const DEMO_STUDY_TYPE = '概念筛选';

export const DEMO_BUSINESS_QUESTION =
  '针对孕期女性与 0-3 岁宝宝妈妈，哪款新品饮品概念最能建立“营养可信赖、日常无负担”的品牌认知，并值得进入下一轮真实消费者验证？';

export const DEMO_DEFAULT_STATUS: DemoScenarioMeta['status'] =
  'completed_with_recommendation';

export const DEMO_SCENARIO_IDS = {
  completedRecommendation: 'completed-recommendation',
  awaitingMidrunReview: 'awaiting-midrun-review',
  rerunSuggested: 'rerun-suggested',
} as const satisfies Record<string, DemoScenarioId>;

export const DEMO_DEFAULT_SCENARIO_ID = DEMO_SCENARIO_IDS.completedRecommendation;

export const DEMO_TARGET_GROUPS = [
  '孕期女性 / Tier-1 / 25-35 岁',
  '0-3 岁宝宝妈妈 / Tier-1&2 / 26-38 岁',
] as const;

export const DEMO_CONSUMER_TWINS_LABEL =
  'Beverage TA v2.1 / Pregnant Women + New Mom';

export const DEMO_TWIN_SUBSET_LABELS = [
  'Beverage TA v2.1 / Pregnant Women Subset',
  'Beverage TA v2.1 / New Mom Subset',
] as const;

export const DEMO_BENCHMARK_PACK = 'Beverage Concept v4';

export const DEMO_LAST_UPDATED = '2025-12-15';

export const DEMO_STIMULI = ['清泉+', '初元优养', '安纯'] as const;

export const DEMO_STIMULUS_SCOPE = '当前范围：概念筛选';

export const DEMO_STIMULUS_EXPANSION_NOTE =
  '后续可扩展至 KV / 文案 / 命名 / 口味测试';

export const DEMO_STUDY_INPUTS_SNAPSHOT = {
  consumerTwinsLabel: DEMO_CONSUMER_TWINS_LABEL,
  builtFrom: '5 份定性报告，12 份访谈录音',
  benchmarkPack: DEMO_BENCHMARK_PACK,
  lastUpdated: DEMO_LAST_UPDATED,
} satisfies StudyInputsSnapshot;

export const DEMO_BASE_STUDY_META = {
  studyId: DEMO_STUDY_ID,
  studyName: DEMO_STUDY_NAME,
  category: DEMO_CATEGORY,
  studyType: DEMO_STUDY_TYPE,
  businessQuestion: DEMO_BUSINESS_QUESTION,
} satisfies Pick<
  DemoScenarioMeta,
  'studyId' | 'studyName' | 'category' | 'studyType' | 'businessQuestion'
>;
