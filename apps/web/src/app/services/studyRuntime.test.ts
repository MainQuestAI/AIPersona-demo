import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  approvePlan,
  createDemoStudy,
  fetchWorkbenchProjection,
  listConsumerTwins,
  listStudies,
  resumeRun,
  startRun,
  submitPlanForApproval,
} from './studyRuntime';

describe('studyRuntime service', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('injects bearer token for protected runtime requests', async () => {
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
    globalThis.localStorage.setItem('aipersona_token', 'token-123');

    await fetchWorkbenchProjection('study-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/studies/study-1/detail',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        headers: expect.any(Headers),
      }),
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token-123');
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
          brand: 'MirrorWorld Demo',
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

  it('prefers the curated default demo twins from the seed pack', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            target_audiences: [],
            twin_versions: [
              {
                id: 'twin-version-aptamil-core',
                name: '爱他美核心妈妈',
                version_no: 1,
                target_audience_label: '精研配方新手妈妈',
                default_demo: true,
              },
              {
                id: 'twin-version-mizone-core',
                name: '脉动通勤白领',
                version_no: 1,
                target_audience_label: '通勤提神白领',
                default_demo: true,
              },
              {
                id: 'twin-version-alpro-scale',
                name: 'Alpro 环保青年',
                version_no: 1,
                target_audience_label: '环保生活方式青年',
                default_demo: false,
              },
            ],
            stimuli: [
              { id: 'stimulus-1', name: '概念 1', stimulus_type: 'concept' },
              { id: 'stimulus-2', name: '概念 2', stimulus_type: 'concept' },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ study: { id: 'study-2' } }), { status: 200 }),
      );

    await createDemoStudy();

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:8000/studies',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          business_question: '哪一个母婴饮品概念值得进入真实消费者验证？',
          study_type: 'concept_screening',
          brand: 'MirrorWorld Demo',
          category: 'Maternal beverage',
          target_groups: ['精研配方新手妈妈', '通勤提神白领'],
          business_goal: {
            objective: '筛出最值得进入下一轮验证的概念',
            decision: 'winner_selection',
          },
          twin_version_ids: ['twin-version-aptamil-core', 'twin-version-mizone-core'],
          stimulus_ids: ['stimulus-1', 'stimulus-2'],
          qual_config: { mode: 'ai_idi', interviews: 4 },
          quant_config: { mode: 'replica_scoring', replicas: 3 },
          generated_by: 'boss',
          approval_required: true,
        }),
      }),
    );
  });

  it('falls back to built-in demo data when the runtime api is unreachable', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const studies = await listStudies();
    const projection = await fetchWorkbenchProjection(studies[0]!.id);

    expect(studies.length).toBeGreaterThan(0);
    expect(studies[0]?.business_question).toBeTruthy();
    expect(projection.study.id).toBe(studies[0]?.id);
    expect(projection.study.brand).toBe('MirrorWorld Demo');
    expect(projection.latest_plan_version?.stimulus_count).toBeGreaterThan(0);
    expect(projection.twins?.length).toBeGreaterThan(0);
  });

  it('keeps the six-brand persona library available in offline fallback mode', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const twins = await listConsumerTwins();

    expect(twins).toHaveLength(100);
    expect(new Set(
      twins.map((twin) => String(twin.persona_profile_snapshot_json?.brand_name ?? '')),
    ).size).toBe(6);
  });

  it('falls back to built-in demo data when the runtime api returns 503', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ detail: 'Authentication service unavailable.' }),
        { status: 503, statusText: 'Service Unavailable' },
      ),
    );

    const studies = await listStudies();

    expect(studies.length).toBeGreaterThan(0);
    expect(studies[0]?.brand).toBe('MirrorWorld Demo');
  });

  it('does not fall back to offline mode when the session is missing', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ detail: 'Authentication required.' }),
        { status: 401, statusText: 'Unauthorized' },
      ),
    );
    globalThis.localStorage.setItem('aipersona_token', 'expired-token');
    globalThis.localStorage.setItem('aipersona_user', JSON.stringify({ display_name: '老板' }));

    await expect(listStudies()).rejects.toThrow('登录状态已失效，请重新登录后继续。');
    expect(globalThis.localStorage.getItem('aipersona_token')).toBeNull();
    expect(globalThis.localStorage.getItem('aipersona_user')).toBeNull();
  });

  it('does not fall back to offline mode when the session is invalid', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ detail: 'Invalid authentication credentials.' }),
        { status: 403, statusText: 'Forbidden' },
      ),
    );

    await expect(fetchWorkbenchProjection('study-1')).rejects.toThrow('登录状态已失效，请重新登录后继续。');
  });

  it('falls back to built-in demo data when the runtime api times out', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockImplementation(() => new Promise(() => {}) as Promise<Response>);

    const studiesPromise = listStudies();
    await vi.advanceTimersByTimeAsync(8_001);
    const studies = await studiesPromise;

    expect(studies.length).toBeGreaterThan(0);
    expect(studies[0]?.brand).toBe('MirrorWorld Demo');
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
        body: JSON.stringify({ actor: 'boss', action: 'continue', decision_comment: 'continue' }),
      }),
    );
  });
});
