# AI Consumer Demo Frontend Mock Data Spec

文档版本：v1  
日期：2026-04-02  
状态：前端 mock data 真源  
适用范围：`AIpersona-demo` 首版前端演示环境

## 1. 文档目标

这份文档用于定义前端演示环境的 mock data 结构，解决三个问题：

1. 组件不能各自写死内容
2. 不同页面必须共享同一研究故事
3. 后续从 mock 切真实 API 时，页面层不需要整体重写

因此 mock data 设计必须同时满足：

- `业务可信`
- `前端好喂`
- `未来可替换成真实 runtime data`

## 2. 设计原则

### 2.1 Runtime-shaped，而不是纯展示型 JSON

前端虽然先吃 mock data，但数据结构仍然要尽量贴近运行时对象：

- `study`
- `studyPlanVersion`
- `studyRun`
- `conversationEvents`
- `resultPanel`
- `compareView`
- `twinCatalog`
- `trustPanel`
- `replay`

### 2.2 文案不能散落在组件里

所有以下内容必须进入 mock layer：

- study name
- business question
- stimuli names
- quant scores
- confidence
- qual themes
- twin excerpts
- next action
- rerun reason

### 2.3 页面只消费 selector-ready data

组件层不应自己做复杂数据拼装。

建议结构：

- `raw scenario module`
- `view adapter / selector`
- `component props`

## 3. 推荐文件结构

```text
src/
  types/
    demo.ts
  mocks/
    scenario-meta.ts
    studies/
      completed-recommendation.ts
      awaiting-midrun-review.ts
      rerun-suggested.ts
    compare/
      concept-compare.ts
    twins/
      twin-catalog.ts
    trust/
      trust-panel.ts
    replay/
      study-replay.ts
    library/
      library-records.ts
    index.ts
```

## 4. 核心 TypeScript 类型

以下类型建议直接放进 `src/types/demo.ts`。

```ts
export type StudyStatus =
  | "draft"
  | "planning"
  | "awaiting_approval"
  | "running"
  | "awaiting_midrun_review"
  | "completed_with_recommendation"
  | "rerun_suggested";

export type TimelineStage =
  | "plan"
  | "approval"
  | "qual"
  | "midrun_review"
  | "quant"
  | "recommendation";

export type ConversationEventType =
  | "agent_message"
  | "plan_approval_card"
  | "qual_session_card"
  | "midrun_review_card"
  | "recommendation_card"
  | "study_complete_card"
  | "rerun_suggestion_card"
  | "evidence_replay_card";

export interface DemoScenarioMeta {
  scenarioId: string;
  studyId: string;
  studyName: string;
  category: string;
  studyType: string;
  businessQuestion: string;
  status: StudyStatus;
  activeTimelineStage: TimelineStage;
}

export interface StudyInputsSnapshot {
  consumerTwinsLabel: string;
  builtFrom: string;
  benchmarkPack: string;
  lastUpdated: string;
}

export interface PlanSummary {
  studyType: string;
  targetGroupCount: number;
  stimuliCount: number;
  qualMode: string;
  quantMode: string;
  estimatedRuntimeMin: number;
  runtimeNote: string;
}

export interface TimelineStep {
  id: TimelineStage;
  label: string;
  status: "done" | "current" | "upcoming";
}

export interface AgentMessageEvent {
  id: string;
  type: "agent_message";
  title?: string;
  body: string;
  timestamp?: string;
}

export interface PlanApprovalEvent {
  id: string;
  type: "plan_approval_card";
  summary: PlanSummary;
  primaryText: string;
  secondaryText: string;
  actions: string[];
}

export interface Excerpt {
  speakerLabel: string;
  lines: string[];
}

export interface QualSessionEvent {
  id: string;
  type: "qual_session_card";
  runningOn: string[];
  completedSessionsLabel: string;
  completedSessionsNote: string;
  emergingThemes: string[];
  helperText: string;
  excerpts: Excerpt[];
}

export interface MidrunReviewEvent {
  id: string;
  type: "midrun_review_card";
  title: string;
  body: string[];
  actions: string[];
}

export interface RecommendationEvent {
  id: string;
  type: "recommendation_card";
  winner: string;
  confidence: string;
  body: string;
  actions: string[];
}

export interface StudyCompleteEvent {
  id: string;
  type: "study_complete_card";
  title: string;
  body: string[];
  actions: string[];
}

export interface RerunSuggestionEvent {
  id: string;
  type: "rerun_suggestion_card";
  title: string;
  reason: string[];
  actions: string[];
}

export type ConversationEvent =
  | AgentMessageEvent
  | PlanApprovalEvent
  | QualSessionEvent
  | MidrunReviewEvent
  | RecommendationEvent
  | StudyCompleteEvent
  | RerunSuggestionEvent;

export interface RankingItem {
  stimulusId: string;
  label: string;
  score: number;
  confidenceLabel: string;
  confidenceLevel: "high" | "medium" | "low";
}

export interface QualThemeGroup {
  stimulusId: string;
  label: string;
  themes: string[];
  summary: string;
}

export interface SegmentDifferenceItem {
  segmentLabel: string;
  strongestOption: string;
  keyDifference: string;
}

export interface RecommendationSummaryData {
  winner: string;
  confidenceLabel: string;
  nextAction: string;
  supportingText: string;
}

export interface ResultPanelData {
  recommendation: RecommendationSummaryData;
  ranking: RankingItem[];
  qualThemes: QualThemeGroup[];
  segmentDifferences: SegmentDifferenceItem[];
}

export interface CompareGridItem {
  label: string;
  quantScore: number;
  themeLabels: string[];
  summary: string;
}

export interface ComparePageData {
  headline: string;
  subheadline: string;
  compareGrid: CompareGridItem[];
  ranking: RankingItem[];
  segmentDifferences: SegmentDifferenceItem[];
  nextActionTitle: string;
  nextActionBody: string;
}

export interface TwinProfile {
  id: string;
  name: string;
  builtFrom: string;
  ageRange: string;
  audienceLabel: string;
  researchReadiness: string[];
  versionNotes: string;
}

export interface TrustPanelData {
  confidenceLabel: string;
  benchmarkPack: string;
  lastCalibration: string;
  approvalTrail: string[];
}

export interface ReplayStage {
  id: "plan" | "qual" | "quant" | "synthesis";
  label: string;
  inputs: string[];
  outputs: string[];
  decisions: string[];
}

export interface ReplayData {
  title: string;
  stages: ReplayStage[];
}

export interface LibraryRecord {
  id: string;
  label: string;
  type: string;
}
```

## 5. 主场景模块定义

### 5.1 `scenario-meta.ts`

只放场景级元信息：

- `studyName`
- `category`
- `studyType`
- `businessQuestion`
- `defaultStatus`

### 5.2 `studies/completed-recommendation.ts`

这是主演示默认入口，必须包含：

- `status = completed_with_recommendation`
- `activeTimelineStage = recommendation`
- 完整 `timelineSteps`
- 完整 `conversationEvents`
- 完整 `resultPanel`
- 与 `View Replay`、`View Full Comparison`、drawer 打开动作相配套的数据引用

### 5.3 `studies/awaiting-midrun-review.ts`

这是用来证明审批门不是装饰的场景，必须包含：

- `status = awaiting_midrun_review`
- 线程停在 `midrun_review_card`
- 右侧结果面板仍展示阶段性 qual 结果，而不是最终 recommendation

### 5.4 `studies/rerun-suggested.ts`

这是用来证明系统会随着输入更新而变强的场景，必须包含：

- `status = rerun_suggested`
- `rerun_suggestion_card`
- 与新 transcript 导入、twin version 变化、confidence 提升建议相一致的 reason

## 6. 组件到数据模块的映射

### Workbench Header

来源：

- `DemoScenarioMeta.studyName`
- `DemoScenarioMeta.status`
- `timelineSteps`

### Study Setup Bar

来源：

- `DemoScenarioMeta.businessQuestion`
- `stimulus labels`
- `StudyInputsSnapshot`

### Conversation Thread

来源：

- `conversationEvents`

要求：

- 必须用 `ConversationEvent` 联合类型驱动渲染
- 不能在组件内临时造字段

### Result Panel

来源：

- `ResultPanelData`

### Compare Page

来源：

- `ComparePageData`

### Twins Page

来源：

- `TwinProfile[]`

### Trust Drawer

来源：

- `TrustPanelData`

### Replay Modal

来源：

- `ReplayData`

## 7. 与 Playbook 的映射规则

这里是最关键的规则。

### 7.1 这些字段必须逐字对齐 `demo_content_playbook.md`

- `studyName`
- `businessQuestion`
- `stimulus labels`
- `winner`
- `quant scores`
- `confidence`
- `qual themes`
- `twin excerpts`
- `nextAction`
- `rerun reason`

### 7.2 这些字段允许前端做展示级转换，但不能改义

- `Completed sessions: 3 / 6`
- `Confidence: 82 / High`
- `Proceed to consumer validation for 清泉+`
- `Built from: 5 qual reports, 12 transcripts`

允许：

- 拆成 label 与 value
- 拆成 chip / badge / metadata rows

不允许：

- 改数字
- 改候选顺序
- 改 winner

## 8. 最小示例

下面这个示例建议直接作为 `completed-recommendation.ts` 的起点。

```ts
export const completedRecommendationScenario = {
  meta: {
    scenarioId: "completed-recommendation",
    studyId: "study-bev-q4-001",
    studyName: "孕期饮品概念筛选 · Beverage TA v2.1 · 2025-Q4",
    category: "Beverage",
    studyType: "Concept Screening",
    businessQuestion:
      "针对孕期女性与 0-3 岁宝宝妈妈，哪款新品饮品概念最能建立“营养可信赖、日常无负担”的品牌认知，并值得进入下一轮真实消费者验证？",
    status: "completed_with_recommendation",
    activeTimelineStage: "recommendation",
  },
  inputsSnapshot: {
    consumerTwinsLabel: "Beverage TA v2.1 / Pregnant Women + New Mom",
    builtFrom: "5 qual reports, 12 transcripts",
    benchmarkPack: "Beverage Concept v4",
    lastUpdated: "2025-12-15",
  },
  resultPanel: {
    recommendation: {
      winner: "清泉+",
      confidenceLabel: "82 / High",
      nextAction: "Proceed to consumer validation",
      supportingText:
        "清泉+ outperforms on safety perception and daily drinkability across both target groups.",
    },
    ranking: [
      { stimulusId: "qingquan", label: "清泉+", score: 74, confidenceLabel: "82 / High", confidenceLevel: "high" },
      { stimulusId: "chuyuan", label: "初元优养", score: 61, confidenceLabel: "82 / High", confidenceLevel: "high" },
      { stimulusId: "anchun", label: "安纯", score: 52, confidenceLabel: "82 / High", confidenceLevel: "high" },
    ],
  },
};
```

## 9. 不允许的坏味道

- 把业务文案直接写进 JSX
- 一个页面自己维护一份排序，另一个页面又维护一份排序
- 组件内部用 `Concept A/B/C` 替换正式命名
- `Rerun Suggested` 单独写成另一个无关故事
- `Twins` 页面只放 placeholder，不接真实 mock

## 10. 验收标准

满足以下条件，这份 mock data 结构才算合格：

1. 三个主状态可切换
2. Workbench / Compare / Twins / Drawers / Replay 用的是同一套真源数据
3. 页面切换后不会出现 winner、分数、主题不一致
4. 后续接 API 时，组件层不需要改业务文案逻辑
