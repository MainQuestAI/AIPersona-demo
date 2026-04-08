import type { DemoScenarioBundle, TimelineStage, TimelineStep } from '@/types/demo';
import {
  DEMO_BASE_STUDY_META,
  DEMO_SCENARIO_IDS,
  DEMO_STUDY_ID,
  DEMO_STUDY_INPUTS_SNAPSHOT,
} from '../scenario-meta';
import {
  completedAgentMessageEvent,
  completedMidrunReviewEvent,
  completedMidrunReviewPanel,
  completedPlanApprovalEvent,
  completedQualSessionEvent,
  completedRecommendationScenario,
  completedRunSteps,
  completedTimelineSteps,
} from './completed-recommendation';

const awaitingTimelineStepStatus: Record<TimelineStage, TimelineStep['status']> = {
  plan: 'done',
  approval: 'done',
  qual: 'done',
  midrun_review: 'current',
  quant: 'upcoming',
  recommendation: 'upcoming',
};

const awaitingTimelineSteps: TimelineStep[] = completedTimelineSteps.map((step) => ({
  ...step,
  status: awaitingTimelineStepStatus[step.id],
}));

const awaitingRunSteps = completedRunSteps.map((step) => ({
  ...step,
  status: awaitingTimelineStepStatus[step.stage],
}));

export const awaitingMidrunReviewScenario = {
  ...completedRecommendationScenario,
  meta: {
    scenarioId: DEMO_SCENARIO_IDS.awaitingMidrunReview,
    ...DEMO_BASE_STUDY_META,
    status: 'awaiting_midrun_review',
    activeTimelineStage: 'midrun_review',
  },
  study: {
    id: DEMO_STUDY_ID,
    scenarioId: DEMO_SCENARIO_IDS.awaitingMidrunReview,
    ...DEMO_BASE_STUDY_META,
    status: 'awaiting_midrun_review',
    activeTimelineStage: 'midrun_review',
  },
  inputsSnapshot: DEMO_STUDY_INPUTS_SNAPSHOT,
  studyRun: {
    ...completedRecommendationScenario.studyRun,
    status: 'awaiting_midrun_review',
    activeTimelineStage: 'midrun_review',
    currentRunStepId: 'run-step-midrun_review',
    runStepIds: awaitingRunSteps.map((step) => step.id),
  },
  timelineSteps: awaitingTimelineSteps,
  runSteps: awaitingRunSteps,
  currentSurfaceKey: 'midrunReviewPanel',
  conversationEvents: [
    completedAgentMessageEvent,
    completedPlanApprovalEvent,
    completedQualSessionEvent,
    completedMidrunReviewEvent,
  ],
  resultPanel: completedRecommendationScenario.resultPanel,
  midrunReviewPanel: completedMidrunReviewPanel,
} satisfies DemoScenarioBundle;
