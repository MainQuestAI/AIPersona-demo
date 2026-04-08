import type {
  ComparePageData,
  DemoScenarioBundle,
  DemoScenarioId,
  DemoScenarioRegistry,
  LibraryRecord,
  MidrunReviewPanelData,
  ResultPanelData,
  ReplayData,
  ScenarioSurfacePanel,
  StudyInputsSnapshot,
  StudyPlanVersion,
  StudyRecord,
  StudyRun,
  TimelineStep,
  TrustPanelData,
  TwinProfile,
} from '@/types/demo';
import {
  DEMO_DEFAULT_SCENARIO_ID,
  DEMO_STIMULI,
  DEMO_STIMULUS_EXPANSION_NOTE,
  DEMO_STIMULUS_SCOPE,
  DEMO_STUDY_INPUTS_SNAPSHOT,
} from '../scenario-meta';
import { awaitingMidrunReviewScenario } from '../studies/awaiting-midrun-review';
import { completedRecommendationScenario } from '../studies/completed-recommendation';
import { rerunSuggestedScenario } from '../studies/rerun-suggested';

export const demoScenarioRegistry = {
  [completedRecommendationScenario.meta.scenarioId]: completedRecommendationScenario,
  [awaitingMidrunReviewScenario.meta.scenarioId]: awaitingMidrunReviewScenario,
  [rerunSuggestedScenario.meta.scenarioId]: rerunSuggestedScenario,
} satisfies DemoScenarioRegistry;

export const demoScenarioList = [
  completedRecommendationScenario,
  awaitingMidrunReviewScenario,
  rerunSuggestedScenario,
] satisfies DemoScenarioBundle[];

export const defaultDemoScenarioId = DEMO_DEFAULT_SCENARIO_ID;

export function getScenarioBundle(
  scenarioId: DemoScenarioId = defaultDemoScenarioId,
): DemoScenarioBundle {
  return demoScenarioRegistry[scenarioId];
}

export function selectScenarioMeta(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
) {
  return scenario.meta;
}

export function selectStudyRecord(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): StudyRecord {
  return scenario.study;
}

export function selectStudyInputsSnapshot(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): StudyInputsSnapshot {
  return scenario.inputsSnapshot;
}

export function selectStudyPlanVersion(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): StudyPlanVersion {
  return scenario.studyPlanVersion;
}

export function selectStudyRun(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): StudyRun {
  return scenario.studyRun;
}

export function selectTimelineSteps(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): TimelineStep[] {
  return scenario.timelineSteps;
}

export function selectRunSteps(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
) {
  return scenario.runSteps;
}

export function selectConversationEvents(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
) {
  return scenario.conversationEvents;
}

export function selectCurrentSurfacePanelData(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): ScenarioSurfacePanel {
  switch (scenario.currentSurfaceKey) {
    case 'midrunReviewPanel':
      return scenario.midrunReviewPanel ?? scenario.resultPanel;
    case 'rerunSuggestionPanel':
      return scenario.rerunSuggestionPanel ?? scenario.resultPanel;
    case 'resultPanel':
    default:
      return scenario.resultPanel;
  }
}

export function selectResultPanelData(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): ResultPanelData {
  return scenario.resultPanel;
}

export function selectMidrunReviewPanelData(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): MidrunReviewPanelData | undefined {
  return scenario.midrunReviewPanel;
}

export function selectWorkbenchHeaderData(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
) {
  return {
    studyName: scenario.meta.studyName,
    status: scenario.meta.status,
    activeTimelineStage: scenario.meta.activeTimelineStage,
    studyType: scenario.meta.studyType,
    businessQuestion: scenario.meta.businessQuestion,
    timelineSteps: scenario.timelineSteps,
  };
}

export function selectStudySetupBarData(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
) {
  return {
    consumerTwinsLabel: scenario.inputsSnapshot.consumerTwinsLabel,
    builtFrom: scenario.inputsSnapshot.builtFrom,
    benchmarkPack: scenario.inputsSnapshot.benchmarkPack,
    lastUpdated: scenario.inputsSnapshot.lastUpdated,
    stimulusLabels: [...DEMO_STIMULI],
    stimulusScope: DEMO_STIMULUS_SCOPE,
    stimulusExpansionNote: DEMO_STIMULUS_EXPANSION_NOTE,
  };
}

export function selectWorkbenchSnapshotData(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
) {
  return {
    meta: selectScenarioMeta(scenario),
    study: selectStudyRecord(scenario),
    inputsSnapshot: selectStudyInputsSnapshot(scenario),
    studyPlanVersion: selectStudyPlanVersion(scenario),
    studyRun: selectStudyRun(scenario),
    timelineSteps: selectTimelineSteps(scenario),
    currentSurfacePanel: selectCurrentSurfacePanelData(scenario),
    conversationEvents: selectConversationEvents(scenario),
  };
}

export function selectComparePageData(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): ComparePageData {
  return scenario.compareView;
}

export function selectTwinCatalogData(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): TwinProfile[] {
  return scenario.twinCatalog;
}

export function selectTrustPanelData(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): TrustPanelData {
  return scenario.trustPanel;
}

export function selectReplayData(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): ReplayData {
  return scenario.replay;
}

export function selectLibraryRecordsData(
  scenario: DemoScenarioBundle = completedRecommendationScenario,
): LibraryRecord[] {
  return scenario.libraryRecords;
}

export function selectScenarioCatalog(): DemoScenarioBundle[] {
  return demoScenarioList;
}

export function selectDefaultScenarioBundle(): DemoScenarioBundle {
  return getScenarioBundle(defaultDemoScenarioId);
}
