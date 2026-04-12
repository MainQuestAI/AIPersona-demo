import { describe, expect, it } from 'vitest';

import type { WorkbenchProjection } from './studyRuntime';
import {
  buildDecisionSnapshotForProjection,
  buildEvidenceChainCardsForProjection,
  buildExecutiveSummaryForProjection,
  buildPromptSuggestions,
  buildStudySessionBoard,
  getPitchScenarioBundle,
} from './workbenchRuntimeBridge';

const baseProjection: WorkbenchProjection = {
  study: {
    id: 'study-1',
    business_question: '哪一个概念更值得推进？',
    study_type: 'concept_screening',
    brand: 'AIpersona Demo',
    category: 'Maternal beverage',
    target_groups: ['Pregnant Women', 'New Mom'],
    status: 'planning',
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
  current_run: null,
  recent_runs: [],
  summary: {
    total_plan_versions: 1,
    total_runs: 0,
    approved_plan_versions: 1,
  },
};

describe('workbenchRuntimeBridge', () => {
  it('builds prompt suggestions from runtime state instead of static copy', () => {
    expect(
      buildPromptSuggestions({
        ...baseProjection,
        latest_plan_version: {
          ...baseProjection.latest_plan_version!,
          approval_status: 'draft',
        },
      }),
    ).toEqual([
      '检查当前计划是否覆盖 2 个目标人群',
      '确认 3 个刺激物与 2 个数字孪生的绑定关系',
      '准备提交审批',
    ]);

    expect(
      buildPromptSuggestions({
        ...baseProjection,
        current_run: {
          id: 'run-1',
          study_plan_version_id: 'version-1',
          status: 'awaiting_midrun_approval',
          workflow_id: 'workflow-1',
          workflow_run_id: 'exec-1',
          step_count: 3,
          approval_status: 'requested',
          steps: [],
          created_at: '2026-04-03T10:10:00+08:00',
          updated_at: '2026-04-03T10:20:00+08:00',
        },
      }),
    ).toEqual([
      '检查定性主题是否已经稳定',
      '批准后继续进入定量排序',
      '如果需要调整刺激物，先暂停当前研究',
    ]);
  });

  it('builds a session board and executive summary from runtime state', () => {
    const board = buildStudySessionBoard(baseProjection);
    expect(board).toHaveLength(6);
    expect(board[0]).toMatchObject({
      id: 'plan',
      status: 'current',
      eyebrow: '研究计划',
    });
    expect(board[1]).toMatchObject({
      id: 'approval',
      headline: '审批已通过',
    });

    expect(buildExecutiveSummaryForProjection(baseProjection)).toEqual({
      headline: '审批已通过，可启动研究',
      detail: '研究计划已锁定为执行版本，可以启动定性定量研究流程。',
    });

    expect(
      buildExecutiveSummaryForProjection({
        ...baseProjection,
        current_run: {
          id: 'run-1',
          study_plan_version_id: 'version-1',
          status: 'succeeded',
          workflow_id: 'workflow-1',
          workflow_run_id: 'exec-1',
          step_count: 4,
          approval_status: 'approved',
          steps: [],
          created_at: '2026-04-03T10:10:00+08:00',
          updated_at: '2026-04-03T10:20:00+08:00',
        },
      }),
    ).toEqual({
      headline: '研究已完成',
      detail: '推荐结论已生成，可查看详细对比、数字孪生溯源或导出报告。',
    });
  });

  it('builds pitch data from runtime artifacts instead of static mock payloads when available', () => {
    const scenario = getPitchScenarioBundle({
      ...baseProjection,
      study: {
        ...baseProjection.study,
        status: 'completed',
      },
      current_run: {
        id: 'run-9',
        study_plan_version_id: 'version-1',
        status: 'succeeded',
        workflow_id: 'workflow-1',
        workflow_run_id: 'exec-1',
        step_count: 4,
        approval_status: 'approved',
        steps: [
          { step_type: 'twin_preparation', status: 'succeeded' },
          { step_type: 'qual_execution', status: 'succeeded' },
          { step_type: 'quant_execution', status: 'succeeded' },
        ],
        created_at: '2026-04-03T10:10:00+08:00',
        updated_at: '2026-04-03T10:20:00+08:00',
      },
      artifacts: [
        {
          id: 'artifact-qual',
          artifact_type: 'qual_transcript',
          format: 'json',
          status: 'ready',
          created_at: '2026-04-03T10:11:00+08:00',
          manifest: {
            themes: {
              themes: ['情绪安全感', '日常饮用适配度'],
              overall_insight: '清泉+ 更容易被理解为日常补水替代选择。',
              per_stimulus: [
                {
                  stimulus_name: '清泉+',
                  themes: ['情绪安全感', '日常饮用适配度'],
                  summary: '轻盈、安心、适合高频饮用。',
                },
              ],
            },
            interviews: [],
          },
        },
        {
          id: 'artifact-quant',
          artifact_type: 'quant_ranking',
          format: 'json',
          status: 'ready',
          created_at: '2026-04-03T10:15:00+08:00',
          manifest: {
            ranking: [
              {
                stimulus_name: '清泉+',
                score: 74,
                confidence: 'high',
                confidence_label: '82 / 高',
                rationale: '整体吸引力最高',
              },
              {
                stimulus_name: '初元优养',
                score: 61,
                confidence: 'medium',
                confidence_label: '71 / 中',
                rationale: '营养感强但略显医疗化',
              },
            ],
            scoring_methodology: '基于定性结果的 SSR 排序',
          },
        },
        {
          id: 'artifact-rec',
          artifact_type: 'recommendation',
          format: 'json',
          status: 'ready',
          created_at: '2026-04-03T10:18:00+08:00',
          manifest: {
            winner: '清泉+',
            confidence_label: '82 / 高',
            next_action: '进入消费者验证',
            supporting_text: '清泉+ 在两个核心人群中更容易建立安全感。',
            segment_differences: [
              {
                segment: '孕期女性',
                preference: '清泉+',
                reason: '更符合天然、无负担预期',
              },
            ],
          },
        },
      ],
    });

    expect(scenario.resultPanel.recommendation.winner).toBe('清泉+');
    expect(scenario.resultPanel.ranking[0]?.label).toBe('清泉+');
    expect(scenario.resultPanel.qualThemes[0]?.themes).toContain('情绪安全感');
    expect(scenario.compareView.ranking[0]?.confidenceLabel).toBe('82 / 高');
    expect(scenario.trustPanel.confidenceLabel).toBe('82 / 高');
    expect(scenario.trustPanel.methodology?.[0]).toContain('定性');
    expect(scenario.trustPanel.evidenceCoverage?.[0]).toContain('孪生');
    expect(scenario.replay.summary).toContain('清泉+');
  });

  it('builds a boss-facing decision snapshot from runtime results', () => {
    const snapshot = buildDecisionSnapshotForProjection({
      ...baseProjection,
      study: {
        ...baseProjection.study,
        status: 'completed',
      },
      cost_summary: {
        estimated_cost: '88.50',
        actual_cost: '23.10',
        total_prompt_tokens: 3210,
        total_completion_tokens: 1888,
        usage_by_model: [],
      },
      artifacts: [
        {
          id: 'artifact-qual',
          artifact_type: 'qual_transcript',
          format: 'json',
          status: 'ready',
          created_at: '2026-04-03T10:11:00+08:00',
          manifest: {
            themes: {
              themes: ['情绪安全感'],
              overall_insight: '清泉+ 更容易建立安全感。',
              per_stimulus: [],
            },
          },
        },
        {
          id: 'artifact-quant',
          artifact_type: 'quant_ranking',
          format: 'json',
          status: 'ready',
          created_at: '2026-04-03T10:15:00+08:00',
          manifest: {
            ranking: [
              {
                stimulus_name: '清泉+',
                score: 74,
                confidence: 'high',
                confidence_label: '82 / 高',
              },
            ],
          },
        },
        {
          id: 'artifact-rec',
          artifact_type: 'recommendation',
          format: 'json',
          status: 'ready',
          created_at: '2026-04-03T10:18:00+08:00',
          manifest: {
            winner: '清泉+',
            confidence_label: '82 / 高',
            next_action: '进入消费者验证',
            supporting_text: '清泉+ 在两个核心人群中更容易建立安全感。',
          },
        },
        {
          id: 'artifact-replay',
          artifact_type: 'replay',
          format: 'json',
          status: 'ready',
          created_at: '2026-04-03T10:19:00+08:00',
          manifest: {
            title: 'concept_screening runtime replay',
            stages: [],
          },
        },
      ],
      twins: [
        { id: 'twin-a' },
        { id: 'twin-b' },
      ] as any,
      stimuli: [
        { id: 'stimulus-a', name: '清泉+' },
        { id: 'stimulus-b', name: '初元优养' },
        { id: 'stimulus-c', name: '安纯' },
      ] as any,
    });

    expect(snapshot.headline).toBe('建议推进 清泉+');
    expect(snapshot.confidenceLabel).toBe('82 / 高');
    expect(snapshot.costLabel).toBe('预算 88.50 / 实际 23.10');
    expect(snapshot.tokenLabel).toBe('已消耗 5,098 tokens');
    expect(snapshot.evidenceLabel).toBe('2 个孪生 · 3 个刺激物 · 4 份关键产物');
    expect(snapshot.nextAction).toBe('进入消费者验证');
  });

  it('builds an evidence chain that tells the boss what to open next', () => {
    const chain = buildEvidenceChainCardsForProjection({
      ...baseProjection,
      study: {
        ...baseProjection.study,
        status: 'completed',
      },
      artifacts: [
        {
          id: 'artifact-rec',
          artifact_type: 'recommendation',
          format: 'json',
          status: 'ready',
          created_at: '2026-04-03T10:18:00+08:00',
          manifest: {
            winner: '清泉+',
            confidence_label: '82 / 高',
            next_action: '进入消费者验证',
            supporting_text: '清泉+ 在两个核心人群中更容易建立安全感。',
          },
        },
      ],
      twins: [
        { id: 'twin-a' },
        { id: 'twin-b' },
      ] as any,
      stimuli: [
        { id: 'stimulus-a', name: '清泉+' },
        { id: 'stimulus-b', name: '初元优养' },
        { id: 'stimulus-c', name: '安纯' },
      ] as any,
    });

    expect(chain).toHaveLength(4);
    expect(chain[0]).toMatchObject({
      id: 'compare',
      headline: '解释清泉+为什么赢',
      ctaLabel: '打开概念对比',
    });
    expect(chain[1]).toMatchObject({
      id: 'twins',
      headline: '确认结论来自哪些孪生',
      ctaLabel: '查看孪生来源',
    });
    expect(chain[2]).toMatchObject({
      id: 'trust',
      headline: '确认这条推荐是否可信',
      ctaLabel: '打开可信度说明',
    });
    expect(chain[3]).toMatchObject({
      id: 'replay',
      headline: '回放这条结论如何形成',
      ctaLabel: '查看研究回放',
    });
  });

  it('keeps empty real asset arrays instead of silently falling back to mock data', () => {
    const scenario = getPitchScenarioBundle({
      ...baseProjection,
      study: {
        ...baseProjection.study,
        status: 'completed',
      },
      artifacts: [
        {
          id: 'artifact-rec',
          artifact_type: 'recommendation',
          format: 'json',
          status: 'ready',
          created_at: '2026-04-03T10:18:00+08:00',
          manifest: {
            winner: '清泉+',
            confidence_label: '82 / 高',
            next_action: '进入消费者验证',
            supporting_text: '清泉+ 在两个核心人群中更容易建立安全感。',
          },
        },
      ],
      twins: [],
      stimuli: [],
    });

    expect(scenario.twinCatalog).toEqual([]);
    expect(scenario.libraryRecords).toEqual([]);
  });

  it('builds mid-run review decision support from runtime counts instead of leaving an empty approval card', () => {
    const scenario = getPitchScenarioBundle({
      ...baseProjection,
      current_run: {
        id: 'run-mid',
        study_plan_version_id: 'version-1',
        status: 'awaiting_midrun_approval',
        workflow_id: 'workflow-mid',
        workflow_run_id: 'exec-mid',
        step_count: 3,
        approval_status: 'requested',
        steps: [],
        created_at: '2026-04-03T10:10:00+08:00',
        updated_at: '2026-04-03T10:20:00+08:00',
      },
      artifacts: [
        {
          id: 'artifact-qual',
          artifact_type: 'qual_transcript',
          format: 'json',
          status: 'ready',
          created_at: '2026-04-03T10:11:00+08:00',
          manifest: {
            themes: {
              themes: ['情绪安全感', '功能可信度', '日常饮用适配度'],
            },
            interviews: [{ id: 'i1' }, { id: 'i2' }, { id: 'i3' }, { id: 'i4' }],
          },
        },
      ],
      twins: [
        { id: 'twin-a' },
        { id: 'twin-b' },
      ] as any,
      stimuli: [
        { id: 'stimulus-a', name: '清泉+' },
        { id: 'stimulus-b', name: '初元优养' },
        { id: 'stimulus-c', name: '安纯' },
      ] as any,
    });

    expect(scenario.midrunReviewPanel?.metrics?.[0]).toMatchObject({
      label: '目标人群覆盖',
      value: '2 / 2 已覆盖',
    });
    expect(scenario.midrunReviewPanel?.metrics?.[1]).toMatchObject({
      label: '访谈轮次',
      value: '4 轮已完成',
    });
    expect(scenario.midrunReviewPanel?.focusThemes).toContain('情绪安全感');
    expect(scenario.conversationEvents.find((event) => event.type === 'midrun_review_card')).toMatchObject({
      decisionSummary: expect.stringContaining('当前定性阶段'),
      recommendation: expect.stringContaining('继续进入定量排序'),
    });
  });

  it('maps replay artifact stages to ReplayData when insights.replay is present', () => {
    const scenario = getPitchScenarioBundle({
      ...baseProjection,
      study: {
        ...baseProjection.study,
        status: 'completed',
      },
      current_run: {
        id: 'run-replay',
        study_plan_version_id: 'version-1',
        status: 'succeeded',
        workflow_id: 'workflow-1',
        workflow_run_id: 'exec-1',
        step_count: 4,
        approval_status: 'approved',
        steps: [],
        created_at: '2026-04-03T10:10:00+08:00',
        updated_at: '2026-04-03T10:20:00+08:00',
      },
      artifacts: [
        {
          id: 'artifact-rec',
          artifact_type: 'recommendation',
          format: 'json',
          status: 'ready',
          created_at: '2026-04-03T10:18:00+08:00',
          manifest: {
            winner: '清泉+',
            confidence_label: '82 / 高',
            next_action: '进入消费者验证',
            supporting_text: '清泉+ 更容易建立安全感。',
          },
        },
      ],
      // insights.replay simulates what projections.py now provides
      insights: {
        replay: {
          title: 'concept_screening 研究回放',
          stages: [
            {
              id: 'plan',
              label: '计划锁定',
              inputs: ['哪一个概念更值得推进？'],
              outputs: ['2 个孪生版本', '3 个刺激物'],
              decisions: ['进入 AI 定性访谈'],
            },
            {
              id: 'qual',
              label: '定性访谈',
              inputs: ['哪一个概念更值得推进？'],
              outputs: ['3 个核心主题'],
              decisions: ['进入定量排序'],
            },
          ],
        },
      },
    } as any);

    expect(scenario.replay.title).toBe('concept_screening 研究回放');
    expect(scenario.replay.stages).toHaveLength(2);
    expect(scenario.replay.stages[0]).toMatchObject({
      id: 'plan',
      label: '计划锁定',
      inputs: ['哪一个概念更值得推进？'],
    });
    expect(scenario.replay.stages[1]).toMatchObject({
      id: 'qual',
      label: '定性访谈',
      outputs: ['3 个核心主题'],
    });
  });
});
