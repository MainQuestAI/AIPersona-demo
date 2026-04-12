import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  approvePlan,
  createDemoStudy,
  fetchWorkbenchProjection,
  resumeRun,
  startRun,
  submitPlanForApproval,
} from './studyRuntime';

describe('studyRuntime service', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('loads workbench projection from the runtime api', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          study: { id: 'study-1' },
          plan: { id: 'plan-1' },
          latest_plan_version: null,
          current_run: null,
          recent_runs: [],
          summary: {
            total_plan_versions: 1,
            total_runs: 0,
            approved_plan_versions: 0,
          },
        }),
        { status: 200 },
      ),
    );

    await fetchWorkbenchProjection('study-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/studies/study-1/detail',
      { signal: undefined },
    );
  });

  it('creates a demo study and returns the runtime bundle', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            target_audiences: [],
            twin_versions: [
              { id: 'twin-version-1', name: '孕期女性孪生', version_no: 1 },
              { id: 'twin-version-2', name: '新手妈妈孪生', version_no: 1 },
            ],
            stimuli: [
              { id: 'stimulus-1', name: '清泉+', stimulus_type: 'concept' },
              { id: 'stimulus-2', name: '初元优养', stimulus_type: 'concept' },
              { id: 'stimulus-3', name: '安纯', stimulus_type: 'concept' },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ study: { id: 'study-1' } }), { status: 200 }),
      );

    const result = await createDemoStudy();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:8000/bootstrap/seed-assets',
      expect.objectContaining({ method: 'POST' }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/studies',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          business_question: '哪一个母婴饮品概念值得进入真实消费者验证？',
          study_type: 'concept_screening',
          brand: 'AIpersona Demo',
          category: 'Maternal beverage',
          target_groups: ['Pregnant Women', 'New Mom'],
          business_goal: {
            objective: '筛出最值得进入下一轮验证的概念',
            decision: 'winner_selection',
          },
          twin_version_ids: ['twin-version-1', 'twin-version-2'],
          stimulus_ids: ['stimulus-1', 'stimulus-2', 'stimulus-3'],
          qual_config: { mode: 'ai_idi', interviews: 6 },
          quant_config: { mode: 'replica_scoring', replicas: 3 },
          generated_by: 'boss',
          approval_required: true,
        }),
      }),
    );
    expect(result.study.id).toBe('study-1');
  });

  it('submits plan approval with the actor payload', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ status: 'requested' }), { status: 200 }),
    );

    await submitPlanForApproval('study-1', 'version-1', 'boss');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/studies/study-1/plan-versions/version-1/submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ actor: 'boss' }),
      }),
    );
  });

  it('approves a plan and carries the decision comment', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ approval_status: 'approved' }), { status: 200 }),
    );

    await approvePlan('study-1', 'version-1', 'boss', 'go');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/studies/study-1/plan-versions/version-1/approve',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ actor: 'boss', decision_comment: 'go' }),
      }),
    );
  });

  it('starts a run against the approved version', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'run-1' }), { status: 200 }));

    await startRun('study-1', 'version-1', 'boss');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/studies/study-1/runs',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          study_plan_version_id: 'version-1',
          requested_by: 'boss',
        }),
      }),
    );
  });

  it('resumes a paused run with approval context', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ status: 'awaiting_midrun_approval' }), { status: 200 }),
    );

    await resumeRun('study-1', 'run-1', 'boss', 'continue');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/studies/study-1/runs/run-1/resume',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ actor: 'boss', decision_comment: 'continue' }),
      }),
    );
  });
});
