import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { getScenarioBundle } from '@/mocks/selectors';

import { ResultPanel } from './result-panel';
import type { WorkbenchProjection } from '@/app/services/studyRuntime';

const runningProjection: WorkbenchProjection = {
  study: {
    id: 'study-1',
    business_question: '哪一个概念更值得推进？',
    study_type: 'concept_screening',
    brand: 'AIpersona Demo',
    category: 'Maternal beverage',
    target_groups: ['Pregnant Women'],
    status: 'running',
  },
  plan: {
    id: 'plan-1',
    draft_status: 'approved',
    current_draft_version_id: 'version-1',
    latest_approved_version_id: 'version-1',
    current_execution_version_id: 'version-1',
  },
  latest_plan_version: {
    id: 'version-1',
    version_no: 1,
    approval_status: 'approved',
    status: 'active',
    approval_required: true,
    generated_by: 'boss',
    estimated_cost: '88.50',
    stimulus_count: 3,
    twin_count: 2,
    stimulus_ids: ['stimulus-a', 'stimulus-b', 'stimulus-c'],
    twin_version_ids: ['twin-a', 'twin-b'],
    created_at: '2026-04-03T10:00:00+08:00',
  },
  current_run: {
    id: 'run-1',
    study_plan_version_id: 'version-1',
    status: 'running',
    workflow_id: 'workflow-1',
    workflow_run_id: 'exec-1',
    step_count: 2,
    approval_status: 'approved',
    steps: [],
    created_at: '2026-04-03T10:10:00+08:00',
    updated_at: '2026-04-03T10:20:00+08:00',
  },
  recent_runs: [],
  summary: {
    total_plan_versions: 1,
    total_runs: 1,
    approved_plan_versions: 1,
  },
};

describe('ResultPanel', () => {
  it('renders an in-progress state instead of completed findings when the run is still running', () => {
    const html = renderToString(
      <ResultPanel
        projection={runningProjection}
        scenario={getScenarioBundle('completed-recommendation')}
        onOpenCompare={vi.fn()}
        onOpenReplay={vi.fn()}
        onOpenTrust={vi.fn()}
        onOpenTwins={vi.fn()}
        onOpenInputs={vi.fn()}
      />,
    );

    expect(html).toContain('研究执行中');
    expect(html).toContain('准备中');
    expect(html).not.toContain('研究结论');
  });
});
