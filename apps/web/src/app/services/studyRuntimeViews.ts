import type { WorkbenchProjection } from './studyRuntime';

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  planning: '计划中',
  pending_approval: '待审批',
  approved: '已审批',
  queued: '排队中',
  running: '执行中',
  awaiting_midrun_approval: '待中途审核',
  paused_for_adjustment: '待调整',
  succeeded: '已完成',
  failed: '执行异常',
  completed: '已完成',
  not_started: '待启动',
  ready: '就绪',
  pending: '待处理',
  processing: '处理中',
  active: '活跃',
  mapped: '已映射',
  unmapped: '待映射',
};

export function translateStatus(status: string | null | undefined): string {
  if (!status) return '待启动';
  return STATUS_LABELS[status] ?? status;
}

const STIMULUS_TYPE_LABELS: Record<string, string> = {
  concept: '概念卡',
  packaging: '包装设计',
  ad_copy: '广告文案',
  key_visual: '主视觉',
};

export function translateStimulusType(type: string | null | undefined): string {
  if (!type) return '未分类';
  return STIMULUS_TYPE_LABELS[type] ?? type;
}

const STUDY_TYPE_LABELS: Record<string, string> = {
  concept_screening: '概念筛选',
  naming_test: '命名测试',
  communication_test: '沟通素材测试',
  pack_test: '包装测试',
  usage_attitude: '使用态度研究',
};

export function translateStudyType(type: string | null | undefined): string {
  if (!type) return '研究';
  return STUDY_TYPE_LABELS[type] ?? type;
}

const TWIN_LABELS: Record<string, string> = {
  '7f4a4e61-5b21-4d4e-8a4e-4f312f6b1001': '孕期女性孪生',
  '7f4a4e61-5b21-4d4e-8a4e-4f312f6b1002': '新手妈妈孪生',
};

const STIMULUS_LABELS: Record<string, string> = {
  '8f5b5f72-6c32-4e5f-9b5f-5f42307c2001': 'Concept A',
  '8f5b5f72-6c32-4e5f-9b5f-5f42307c2002': 'Concept B',
  '8f5b5f72-6c32-4e5f-9b5f-5f42307c2003': 'Concept C',
};

type CompareViewModel = {
  decision: {
    title: string;
    body: string;
  };
  reference: {
    title: string;
    metrics: string[];
  };
  comparison: {
    title: string;
    metrics: string[];
  };
  axes: Array<{
    label: string;
    reference: string;
    comparison: string;
  }>;
};

type TwinRegistryModel = {
  summary: Array<{
    label: string;
    value: string;
  }>;
  cards: Array<{
    id: string;
    title: string;
    detail: string;
    chips: string[];
  }>;
};

function getPlanVersionLabel(projection: WorkbenchProjection): string {
  const versionNo = projection.latest_plan_version?.version_no;
  return versionNo ? `v${versionNo}` : '--';
}

export function formatDemoTwinLabel(twinId: string): string {
  return TWIN_LABELS[twinId] ?? `Twin ${twinId}`;
}

export function formatDemoStimulusLabel(stimulusId: string): string {
  return STIMULUS_LABELS[stimulusId] ?? `Stimulus ${stimulusId}`;
}

export function buildStudyRoute(path: string, studyId: string): string {
  if (!studyId) {
    return '/studies';
  }
  if (path === '/workbench' || path === '/compare' || path === '/twins') {
    const view = path.replace('/', '');
    return `/studies/${encodeURIComponent(studyId)}/${view}`;
  }
  return path;
}

export function buildCompareViewModel(
  projection: WorkbenchProjection,
): CompareViewModel {
  const latestPlanVersion = projection.latest_plan_version;
  const currentRun = projection.current_run;
  const runStatus = currentRun?.status ?? 'not_started';
  const approvalStatus = currentRun?.approval_status ?? latestPlanVersion?.approval_status ?? '--';

  let decisionTitle = '可启动研究执行';
  let decisionBody = '研究计划已就绪，可进入下一步操作。';
  if (runStatus === 'awaiting_midrun_approval') {
    decisionTitle = '等待中途审核确认';
    decisionBody = '定性阶段已完成，需审核确认后继续进入定量排序。';
  } else if (runStatus === 'paused_for_adjustment') {
    decisionTitle = '研究已暂停，等待调整计划';
    decisionBody = '当前执行已暂停，请先调整目标人群或刺激物配置，再重新启动新的研究执行。';
  } else if (runStatus === 'succeeded') {
    decisionTitle = '研究已完成，可查看结果';
    decisionBody = '全部研究阶段已完成，推荐结论已生成。';
  }

  return {
    decision: {
      title: decisionTitle,
      body: decisionBody,
    },
    reference: {
      title: `计划 ${getPlanVersionLabel(projection)}`,
      metrics: [
        `${latestPlanVersion?.stimulus_count ?? 0} 个刺激物`,
        `${latestPlanVersion?.twin_count ?? 0} 个孪生`,
        `成本 ${latestPlanVersion?.estimated_cost ?? '--'}`,
      ],
    },
    comparison: {
      title: currentRun ? `执行 #${currentRun.id.slice(0, 8)}` : '暂无执行记录',
      metrics: [
        `${currentRun?.step_count ?? 0} 个步骤`,
        `审批 ${approvalStatus}`,
        `状态 ${runStatus}`,
      ],
    },
    axes: [
      {
        label: '审批状态',
        reference: latestPlanVersion?.approval_status ?? '--',
        comparison: approvalStatus,
      },
      {
        label: '执行版本',
        reference: projection.plan.current_execution_version_id ?? '--',
        comparison: currentRun?.study_plan_version_id ?? '--',
      },
      {
        label: '运行状态',
        reference: latestPlanVersion?.status ?? '--',
        comparison: runStatus,
      },
    ],
  };
}

export function buildTwinRegistryModel(
  projection: WorkbenchProjection,
): TwinRegistryModel {
  const latestPlanVersion = projection.latest_plan_version;
  const twins = projection.twins ?? [];
  const targetGroups = projection.study.target_groups ?? [];
  const planLabel = getPlanVersionLabel(projection);
  const twinRecords: Array<{
    id: string;
    target_audience_label?: string | null;
    persona_profile_snapshot_json?: Record<string, unknown> | null;
  }> = twins.length > 0
    ? twins
    : (latestPlanVersion?.twin_version_ids ?? []).map((id) => ({ id }));

  return {
    summary: [
      { label: '孪生数量', value: String(latestPlanVersion?.twin_count ?? 0) },
      { label: '刺激物数量', value: String(latestPlanVersion?.stimulus_count ?? 0) },
      { label: '目标人群', value: String(targetGroups.length) },
      { label: '计划版本', value: planLabel },
    ],
    cards: twinRecords.map((twin, index) => ({
      id: twin.id,
      title:
        (typeof twin.persona_profile_snapshot_json?.name === 'string'
          ? twin.persona_profile_snapshot_json.name
          : undefined) ??
        (typeof twin.target_audience_label === 'string' ? `${twin.target_audience_label}孪生` : undefined) ??
        formatDemoTwinLabel(twin.id),
      detail: `绑定人群：${twin.target_audience_label ?? targetGroups[index] ?? targetGroups[0] ?? '待补充'}`,
      chips: ['溯源', `计划 ${planLabel}`],
    })),
  };
}

export type { CompareViewModel, TwinRegistryModel };
