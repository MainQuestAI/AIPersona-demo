import { describe, expect, it } from 'vitest';

import type { WorkbenchProjection } from './studyRuntime';
import {
  buildCompareViewModel,
  buildStudyRoute,
  buildTwinRegistryModel,
} from './studyRuntimeViews';

const projection: WorkbenchProjection = {
  study: {
    id: 'study-1',
    business_question: '哪一个概念更值得进入验证？',
    study_type: 'concept_screening',
    brand: 'AIpersona Demo',
    category: 'Maternal beverage',
    target_groups: ['Pregnant Women', 'New Mom'],
    status: 'planning',
  },
  plan: {
    id: 'plan-1',
    draft_status: 'approved',
    current_draft_version_id: 'version-2',
    latest_approved_version_id: 'version-2',
    current_execution_version_id: 'version-2',
  },
  latest_plan_version: {
    id: 'version-2',
    version_no: 2,
    approval_status: 'approved',
    status: 'active',
    approval_required: true,
    generated_by: 'boss',
    estimated_cost: '88.50',
    stimulus_count: 3,
    twin_count: 2,
    stimulus_ids: ['stimulus-a', 'stimulus-b', 'stimulus-c'],
    twin_version_ids: ['twin-alpha', 'twin-beta'],
    created_at: '2026-04-03T10:00:00+08:00',
  },
  current_run: {
    id: 'run-9',
    study_plan_version_id: 'version-2',
    status: 'awaiting_midrun_approval',
    workflow_id: 'study-run-run-9',
    workflow_run_id: 'workflow-exec-run-9',
    step_count: 3,
    approval_status: 'requested',
    steps: [
      { step_type: 'twin_preparation', status: 'succeeded' },
      { step_type: 'qual_execution', status: 'succeeded' },
      { step_type: 'midrun_review', status: 'awaiting_approval' },
    ],
    created_at: '2026-04-03T10:15:00+08:00',
    updated_at: '2026-04-03T10:30:00+08:00',
  },
  recent_runs: [],
  summary: {
    total_plan_versions: 2,
    total_runs: 1,
    approved_plan_versions: 1,
  },
};

describe('studyRuntimeViews', () => {
  it('builds route links that keep the active study context', () => {
    expect(buildStudyRoute('/workbench', 'study-1')).toBe('/studies/study-1/workbench');
    expect(buildStudyRoute('/compare', 'study-1')).toBe('/studies/study-1/compare');
    expect(buildStudyRoute('/twins', '')).toBe('/studies');
  });

  it('builds compare view data from a real runtime projection', () => {
    const viewModel = buildCompareViewModel(projection);

    expect(viewModel.decision.title).toBe('等待中途审核确认');
    expect(viewModel.reference.title).toContain('计划 v2');
    expect(viewModel.reference.metrics).toContain('3 个刺激物');
    expect(viewModel.comparison.metrics).toContain('3 个步骤');
    expect(viewModel.axes).toEqual([
      { label: '审批状态', reference: 'approved', comparison: 'requested' },
      { label: '执行版本', reference: 'version-2', comparison: 'version-2' },
      { label: '运行状态', reference: 'active', comparison: 'awaiting_midrun_approval' },
    ]);
  });

  it('builds twin registry cards from the latest approved plan payload', () => {
    const registry = buildTwinRegistryModel(projection);

    expect(registry.summary).toEqual([
      { label: '孪生数量', value: '2' },
      { label: '刺激物数量', value: '3' },
      { label: '目标人群', value: '2' },
      { label: '计划版本', value: 'v2' },
    ]);
    expect(registry.cards).toEqual([
      {
        id: 'twin-alpha',
        title: 'Twin twin-alpha',
        detail: '绑定人群：Pregnant Women',
        chips: ['溯源', '计划 v2'],
      },
      {
        id: 'twin-beta',
        title: 'Twin twin-beta',
        detail: '绑定人群：New Mom',
        chips: ['溯源', '计划 v2'],
      },
    ]);
  });
});
