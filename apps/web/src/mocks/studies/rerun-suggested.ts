import type { DemoScenarioBundle, TimelineStage, TimelineStep } from '@/types/demo';
import {
  DEMO_BASE_STUDY_META,
  DEMO_SCENARIO_IDS,
  DEMO_STUDY_INPUTS_SNAPSHOT,
} from '../scenario-meta';
import {
  completedAgentMessageEvent,
  completedConceptCompareView,
  completedLibraryRecords,
  completedMidrunReviewEvent,
  completedPlanApprovalEvent,
  completedQualSessionEvent,
  completedRecommendationEvent,
  completedRecommendationScenario,
  completedRerunSuggestionEvent,
  completedRerunSuggestionPanel,
  completedRunSteps,
  completedStudy,
  completedStudyCompleteEvent,
  completedStudyPlanVersion,
  completedTimelineSteps,
  completedTwinCatalog,
  completedTrustPanel,
  completedStudyReplay,
  completedResultPanel,
} from './completed-recommendation';

const rerunTimelineStepStatus: Record<TimelineStage, TimelineStep['status']> = {
  plan: 'done',
  approval: 'done',
  qual: 'done',
  midrun_review: 'done',
  quant: 'done',
  recommendation: 'current',
};

const rerunTimelineSteps: TimelineStep[] = completedTimelineSteps.map((step) => ({
  ...step,
  status: rerunTimelineStepStatus[step.id],
}));

const rerunRunSteps = completedRunSteps.map((step) => ({
  ...step,
  status: rerunTimelineStepStatus[step.stage],
}));

const rerunTwinCatalog = completedTwinCatalog.map((profile) => ({
  ...profile,
  versionNotes: `${profile.versionNotes}; refreshed after 5 new maternal-language transcripts were added`,
}));

const rerunInputsSnapshot = {
  ...DEMO_STUDY_INPUTS_SNAPSHOT,
  builtFrom: '5 份定性报告，12 份访谈录音 + 5 份新增孕产用户访谈录音',
  lastUpdated: '2026-04-03',
};

export const rerunSuggestedScenario = {
  ...completedRecommendationScenario,
  meta: {
    scenarioId: DEMO_SCENARIO_IDS.rerunSuggested,
    ...DEMO_BASE_STUDY_META,
    status: 'rerun_suggested',
    activeTimelineStage: 'recommendation',
  },
  study: {
    ...completedStudy,
    scenarioId: DEMO_SCENARIO_IDS.rerunSuggested,
    status: 'rerun_suggested',
    activeTimelineStage: 'recommendation',
  },
  inputsSnapshot: rerunInputsSnapshot,
  studyPlanVersion: {
    ...completedStudyPlanVersion,
    lastUpdated: '2026-04-03',
  },
  studyRun: {
    ...completedRecommendationScenario.studyRun,
    status: 'rerun_suggested',
    activeTimelineStage: 'recommendation',
    currentRunStepId: 'run-step-recommendation',
    lastUpdated: '2026-04-03',
    runStepIds: rerunRunSteps.map((step) => step.id),
  },
  timelineSteps: rerunTimelineSteps,
  runSteps: rerunRunSteps,
  currentSurfaceKey: 'rerunSuggestionPanel',
  conversationEvents: [
    completedAgentMessageEvent,
    completedPlanApprovalEvent,
    completedQualSessionEvent,
    completedMidrunReviewEvent,
    completedRecommendationEvent,
    completedStudyCompleteEvent,
    completedRerunSuggestionEvent,
  ],
  resultPanel: completedResultPanel,
  rerunSuggestionPanel: completedRerunSuggestionPanel,
  compareView: completedConceptCompareView,
  twinCatalog: rerunTwinCatalog,
  trustPanel: completedTrustPanel,
  replay: completedStudyReplay,
  libraryRecords: completedLibraryRecords,
} satisfies DemoScenarioBundle;
