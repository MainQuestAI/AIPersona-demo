export type StudyStatus =
  | 'draft'
  | 'planning'
  | 'awaiting_approval'
  | 'pending_approval'
  | 'approved'
  | 'running'
  | 'awaiting_midrun_approval'
  | 'awaiting_midrun_review'
  | 'completed'
  | 'completed_with_recommendation'
  | 'failed'
  | 'rerun_suggested';

export type StudyRunStatus = StudyStatus | 'queued' | 'succeeded';

export type TimelineStage =
  | 'plan'
  | 'approval'
  | 'qual'
  | 'midrun_review'
  | 'quant'
  | 'recommendation';

export type ConversationEventType =
  | 'agent_message'
  | 'user_message'
  | 'plan_approval_card'
  | 'qual_session_card'
  | 'midrun_review_card'
  | 'recommendation_card'
  | 'study_complete_card'
  | 'rerun_suggestion_card'
  | 'evidence_replay_card';

export type DemoScenarioId =
  | 'completed-recommendation'
  | 'awaiting-midrun-review'
  | 'rerun-suggested';

export type RunStepStatus = 'done' | 'current' | 'upcoming';

export type PlanVersionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'superseded';

export type ScenarioSurfaceKey =
  | 'resultPanel'
  | 'midrunReviewPanel'
  | 'rerunSuggestionPanel';

export type ReplayStageId = 'plan' | 'qual' | 'quant' | 'synthesis';

export interface DemoScenarioMeta {
  scenarioId: DemoScenarioId;
  studyId: string;
  studyName: string;
  category: string;
  studyType: string;
  businessQuestion: string;
  status: StudyStatus;
  activeTimelineStage: TimelineStage;
}

export interface StudyRecord {
  id: string;
  scenarioId: DemoScenarioId;
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
  status: RunStepStatus;
}

export interface RunStep {
  id: string;
  studyRunId: string;
  stage: TimelineStage;
  label: string;
  status: RunStepStatus;
}

export interface StudyPlanVersion {
  id: string;
  studyId: string;
  versionLabel: string;
  status: PlanVersionStatus;
  summary: PlanSummary;
  selectedTwins: string[];
  selectedStimuli: string[];
  approvalRequired: boolean;
  lastUpdated: string;
}

export interface StudyRun {
  id: string;
  studyId: string;
  studyPlanVersionId: string;
  status: StudyRunStatus;
  activeTimelineStage: TimelineStage;
  currentRunStepId: string;
  runStepIds: string[];
  lastUpdated: string;
}

export interface AgentMessageEvent {
  id: string;
  type: 'agent_message';
  title?: string;
  body: string;
  timestamp?: string;
}

export interface UserMessageEvent {
  id: string;
  type: 'user_message';
  body: string;
  timestamp?: string;
}

export interface PlanApprovalEvent {
  id: string;
  type: 'plan_approval_card';
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
  type: 'qual_session_card';
  runningOn: string[];
  completedSessionsLabel: string;
  completedSessionsNote: string;
  emergingThemes: string[];
  helperText: string;
  excerpts: Excerpt[];
}

export interface MidrunReviewEvent {
  id: string;
  type: 'midrun_review_card';
  title: string;
  body: string[];
  decisionSummary?: string;
  metrics?: MidrunReviewMetric[];
  focusThemes?: string[];
  recommendation?: string;
  actions: string[];
}

export interface MidrunReviewMetric {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'warning';
}

export interface RecommendationEvent {
  id: string;
  type: 'recommendation_card';
  winner: string;
  confidence: string;
  body: string;
  actions: string[];
}

export interface StudyCompleteEvent {
  id: string;
  type: 'study_complete_card';
  title: string;
  body: string[];
  actions: string[];
}

export interface RerunSuggestionEvent {
  id: string;
  type: 'rerun_suggestion_card';
  title: string;
  reason: string[];
  actions: string[];
}

export interface EvidenceReplayEvent {
  id: string;
  type: 'evidence_replay_card';
  title: string;
  body: string[];
  actions: string[];
}

export type ConversationEvent =
  | AgentMessageEvent
  | UserMessageEvent
  | PlanApprovalEvent
  | QualSessionEvent
  | MidrunReviewEvent
  | RecommendationEvent
  | StudyCompleteEvent
  | RerunSuggestionEvent
  | EvidenceReplayEvent;

export interface RankingItem {
  stimulusId: string;
  label: string;
  score: number;
  confidenceLabel: string;
  confidenceLevel: 'high' | 'medium' | 'low';
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

export interface MidrunReviewPanelData {
  title: string;
  body: string[];
  decisionSummary?: string;
  metrics?: MidrunReviewMetric[];
  focusThemes: string[];
  recommendation?: string;
  actions: string[];
}

export interface RerunSuggestionPanelData {
  title: string;
  body: string[];
  reason: string[];
  actions: string[];
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
  methodology?: string[];
  evidenceCoverage?: string[];
  costNote?: string;
  recommendedAction?: string;
}

export interface ReplayStage {
  id: ReplayStageId;
  label: string;
  inputs: string[];
  outputs: string[];
  decisions: string[];
}

export interface ReplayData {
  title: string;
  stages: ReplayStage[];
  summary?: string;
  nextAction?: string;
}

export interface LibraryRecord {
  id: string;
  label: string;
  type: string;
}

export type ScenarioSurfacePanel =
  | ResultPanelData
  | MidrunReviewPanelData
  | RerunSuggestionPanelData;

export interface DemoScenarioBundle {
  meta: DemoScenarioMeta;
  study: StudyRecord;
  inputsSnapshot: StudyInputsSnapshot;
  studyPlanVersion: StudyPlanVersion;
  studyRun: StudyRun;
  timelineSteps: TimelineStep[];
  runSteps: RunStep[];
  currentSurfaceKey: ScenarioSurfaceKey;
  conversationEvents: ConversationEvent[];
  resultPanel: ResultPanelData;
  midrunReviewPanel?: MidrunReviewPanelData;
  rerunSuggestionPanel?: RerunSuggestionPanelData;
  compareView: ComparePageData;
  twinCatalog: TwinProfile[];
  trustPanel: TrustPanelData;
  replay: ReplayData;
  libraryRecords: LibraryRecord[];
}

export type DemoScenarioRegistry = Record<DemoScenarioId, DemoScenarioBundle>;
