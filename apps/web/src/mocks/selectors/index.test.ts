import { describe, expect, it } from 'vitest';

import {
  defaultDemoScenarioId,
  demoScenarioList,
  getScenarioBundle,
  selectComparePageData,
  selectCurrentSurfacePanelData,
  selectDefaultScenarioBundle,
  selectReplayData,
  selectResultPanelData,
  selectRunSteps,
  selectScenarioCatalog,
  selectStudyInputsSnapshot,
  selectTrustPanelData,
} from './index';

describe('demo selectors', () => {
  it('locks the default completed recommendation scenario', () => {
    const scenario = selectDefaultScenarioBundle();
    const resultPanel = selectResultPanelData(scenario);

    expect(defaultDemoScenarioId).toBe('completed-recommendation');
    expect(scenario.meta.status).toBe('completed_with_recommendation');
    expect(resultPanel.recommendation.winner).toBe('清泉+');
    expect(resultPanel.recommendation.confidenceLabel).toBe('82 / 高');
    expect(resultPanel.ranking.map((item) => item.score)).toEqual([74, 61, 52]);
  });

  it('returns the mid-run review surface for the awaiting scenario', () => {
    const scenario = getScenarioBundle('awaiting-midrun-review');
    const currentSurface = selectCurrentSurfacePanelData(scenario);
    const runSteps = selectRunSteps(scenario);

    expect(scenario.meta.status).toBe('awaiting_midrun_review');
    expect(scenario.studyRun.currentRunStepId).toBe('run-step-midrun_review');
    expect(runSteps.find((step) => step.stage === 'midrun_review')?.status).toBe(
      'current',
    );
    expect(runSteps.find((step) => step.stage === 'quant')?.status).toBe(
      'upcoming',
    );
    expect(currentSurface).toMatchObject({
      title: '中途审批',
      actions: ['继续定量排序', '暂停编辑'],
    });
  });

  it('returns the rerun suggestion surface and refreshed inputs', () => {
    const scenario = getScenarioBundle('rerun-suggested');
    const currentSurface = selectCurrentSurfacePanelData(scenario);
    const inputsSnapshot = selectStudyInputsSnapshot(scenario);

    expect(scenario.meta.status).toBe('rerun_suggested');
    expect(currentSurface).toMatchObject({
      title: '建议重跑。',
      actions: ['查看变更', '启动重跑', '保留当前结果'],
    });
    expect(inputsSnapshot.lastUpdated).toBe('2026-04-03');
    expect(inputsSnapshot.builtFrom).toContain('5 份新增孕产用户访谈录音');
  });

  it('keeps compare, trust, and replay data available from the same scenario bundle', () => {
    const scenario = selectDefaultScenarioBundle();
    const compareView = selectComparePageData(scenario);
    const trustPanel = selectTrustPanelData(scenario);
    const replay = selectReplayData(scenario);

    expect(
      [compareView.nextActionTitle, compareView.nextActionBody].join(' '),
    ).toContain('进入消费者验证');
    expect(compareView.ranking[0]?.label).toBe('清泉+');
    expect(trustPanel.confidenceLabel).toBe('82 / 高');
    expect(replay.title).toBe('饮品 TA v2.1 运行回放');
  });

  it('exposes a three-scenario catalog from one registry', () => {
    const scenarioCatalog = selectScenarioCatalog();

    expect(scenarioCatalog).toHaveLength(3);
    expect(demoScenarioList).toHaveLength(3);
    expect(scenarioCatalog.map((scenario) => scenario.meta.scenarioId)).toEqual([
      'completed-recommendation',
      'awaiting-midrun-review',
      'rerun-suggested',
    ]);
  });
});
