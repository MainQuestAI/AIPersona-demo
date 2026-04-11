export type StudyBundleStudy = {
  id: string;
  business_question?: string | null;
  study_type?: string | null;
  brand?: string | null;
  category?: string | null;
  target_groups?: string[] | null;
  status?: string | null;
};

export type PlanPlanSnapshot = {
  id: string;
  draft_status?: string | null;
  current_draft_version_id?: string | null;
  latest_approved_version_id?: string | null;
  current_execution_version_id?: string | null;
};

export type PlanVersionSummary = {
  id: string;
  version_no?: number | null;
  approval_status?: string | null;
  status?: string | null;
  approval_required?: boolean | null;
  generated_by?: string | null;
  estimated_cost?: string | null;
  stimulus_count?: number | null;
  twin_count?: number | null;
  stimulus_ids?: string[] | null;
  twin_version_ids?: string[] | null;
  created_at?: string | null;
};

export type RunStepSummary = {
  step_type?: string | null;
  status?: string | null;
};

export type RunSummary = {
  id: string;
  study_plan_version_id?: string | null;
  status?: string | null;
  workflow_id?: string | null;
  workflow_run_id?: string | null;
  step_count?: number | null;
  approval_status?: string | null;
  steps?: RunStepSummary[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ArtifactSummary = {
  id: string;
  artifact_type: string;
  format: string;
  status: string;
  manifest: Record<string, unknown>;
  created_at: string;
};

export type CostSummary = {
  estimated_cost?: string | null;
  actual_cost?: string | null;
  total_prompt_tokens?: number | null;
  total_completion_tokens?: number | null;
  usage_by_model?: Array<{
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    cost: number;
  }> | null;
};

export type ConsumerTwinRecord = {
  id: string;
  business_purpose?: string | null;
  status?: string | null;
  owner?: string | null;
  target_audience_label?: string | null;
  latest_version_id?: string | null;
  latest_version_no?: number | null;
  persona_profile_snapshot_json?: Record<string, unknown> | null;
  source_lineage?: Record<string, unknown> | null;
};

export type TargetAudienceRecord = {
  id: string;
  label: string;
  category?: string | null;
  description?: string | null;
};

export type PersonaProfileRecord = {
  id: string;
  label: string;
  target_audience_id?: string | null;
  target_audience_label?: string | null;
  profile_json?: Record<string, unknown> | null;
};

export type TwinVersionRecord = {
  id: string;
  consumer_twin_id?: string | null;
  version_no?: number | null;
  persona_profile_snapshot_json?: Record<string, unknown> | null;
  source_lineage?: Record<string, unknown> | null;
  target_audience_label?: string | null;
  business_purpose?: string | null;
};

export type StimulusRecord = {
  id: string;
  name: string;
  stimulus_type?: string | null;
  asset_manifest_id?: string | null;
  asset_name?: string | null;
  description?: string | null;
  stimulus_json?: Record<string, unknown> | null;
  status?: string | null;
};

export type StudyListItem = StudyBundleStudy & {
  current_execution_version_id?: string | null;
  latest_plan_version_no?: number | null;
  current_run_status?: string | null;
};

export type StudyDetailProjection = WorkbenchProjection & {
  planning: {
    plan_id: string;
    draft_status?: string | null;
    current_execution_version_id?: string | null;
    latest_plan_version?: PlanVersionSummary | null;
    versions: PlanVersionSummary[];
    approval_history: Array<Record<string, unknown>>;
  };
  execution: {
    current_run: RunSummary | null;
    recent_runs: RunSummary[];
    cost_summary: CostSummary;
  };
  insights: {
    qual: Record<string, unknown>;
    quant: Record<string, unknown>;
    recommendation: Record<string, unknown>;
    replay: Record<string, unknown>;
    confidence: Record<string, unknown>;
  };
  assets: {
    twins: ConsumerTwinRecord[];
    stimuli: StimulusRecord[];
  };
  cost_summary?: CostSummary;
  twins?: ConsumerTwinRecord[];
  stimuli?: StimulusRecord[];
};

export type SeedAssetPack = {
  target_audiences: Array<{ id: string; label: string }>;
  twin_versions: Array<{ id: string; name: string; version_no: number }>;
  stimuli: Array<{ id: string; name: string; stimulus_type: string }>;
};

export type AssetImportResponse = {
  asset: {
    id: string;
    asset_kind: string;
    source_format: string;
    name: string;
  };
  job: {
    id: string;
    status: string;
  };
  dataset_mapping?: {
    id: string;
    mapping_status: string;
  };
  stimulus?: StimulusRecord;
};

export type IngestionJob = {
  id: string;
  asset_manifest_id: string;
  status: string;
  job_type?: string | null;
};

export type DatasetMapping = {
  id: string;
  asset_manifest_id: string;
  mapping_status: string;
};

export type BenchmarkPack = {
  id: string;
  name?: string | null;
};

export type CalibrationRun = {
  id: string;
  status?: string | null;
};

export type ConfidenceSnapshot = {
  id: string;
  label?: string | null;
};

export type DriftAlert = {
  id: string;
  label?: string | null;
};

export type WorkbenchProjection = {
  study: StudyBundleStudy;
  plan: PlanPlanSnapshot;
  latest_plan_version: PlanVersionSummary | null;
  current_run: RunSummary | null;
  recent_runs: RunSummary[];
  artifacts?: ArtifactSummary[];
  twins?: ConsumerTwinRecord[];
  stimuli?: StimulusRecord[];
  cost_summary?: CostSummary;
  summary: {
    total_plan_versions: number;
    total_runs: number;
    approved_plan_versions: number;
  };
};

export type StudyBundleResponse = {
  study: StudyBundleStudy;
  study_plan: PlanPlanSnapshot;
  study_plan_version: PlanVersionSummary;
};

const DEFAULT_API_BASE = 'http://127.0.0.1:8000';
const DEFAULT_ACTOR = 'boss';

function getApiBase(): string {
  return (import.meta.env.VITE_STUDY_RUNTIME_API_URL || DEFAULT_API_BASE) as string;
}

function formatErrorMessage(response: Response): string {
  return `请求失败：${response.status} ${response.statusText}`;
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const apiBase = getApiBase();
  const headers = new Headers(init.headers ?? {});
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const responseInit: RequestInit = {
    ...init,
  };
  if ([...headers.keys()].length > 0) {
    responseInit.headers = headers;
  }
  const response = await fetch(`${apiBase}${path}`, responseInit);

  if (!response.ok) {
    throw new Error(formatErrorMessage(response));
  }

  return (await response.json()) as T;
}

export async function fetchWorkbenchProjection(
  studyId: string,
  options: { signal?: AbortSignal } = {},
): Promise<StudyDetailProjection> {
  return requestJson<StudyDetailProjection>(
    `/studies/${encodeURIComponent(studyId)}/detail`,
    { signal: options.signal },
  );
}

export async function listStudies(
  options: { signal?: AbortSignal } = {},
): Promise<StudyListItem[]> {
  return requestJson<StudyListItem[]>('/studies', { signal: options.signal });
}

export async function bootstrapSeedAssets(): Promise<SeedAssetPack> {
  return requestJson<SeedAssetPack>('/bootstrap/seed-assets', {
    method: 'POST',
  });
}

export async function listConsumerTwins(
  options: { signal?: AbortSignal } = {},
): Promise<ConsumerTwinRecord[]> {
  return requestJson<ConsumerTwinRecord[]>('/consumer-twins', { signal: options.signal });
}

export async function listTargetAudiences(
  options: { signal?: AbortSignal } = {},
): Promise<TargetAudienceRecord[]> {
  return requestJson<TargetAudienceRecord[]>('/target-audiences', { signal: options.signal });
}

export async function listPersonaProfiles(
  options: { signal?: AbortSignal } = {},
): Promise<PersonaProfileRecord[]> {
  return requestJson<PersonaProfileRecord[]>('/persona-profiles', { signal: options.signal });
}

export async function listTwinVersions(
  options: { signal?: AbortSignal } = {},
): Promise<TwinVersionRecord[]> {
  return requestJson<TwinVersionRecord[]>('/twin-versions', { signal: options.signal });
}

export async function listStimuli(
  options: { signal?: AbortSignal } = {},
): Promise<StimulusRecord[]> {
  return requestJson<StimulusRecord[]>('/stimuli', { signal: options.signal });
}

export async function importAsset(
  payload: {
    asset_kind: string;
    name: string;
    source_format: string;
    storage_uri: string;
    created_by?: string;
    metadata?: Record<string, unknown>;
    study_id?: string;
  },
): Promise<AssetImportResponse> {
  return requestJson<AssetImportResponse>('/assets/import', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      created_by: payload.created_by ?? DEFAULT_ACTOR,
      metadata: payload.metadata ?? {},
    }),
  });
}

export async function listIngestionJobs(
  options: { signal?: AbortSignal } = {},
): Promise<IngestionJob[]> {
  return requestJson<IngestionJob[]>('/ingestion/jobs', { signal: options.signal });
}

export async function listDatasetMappings(
  options: { signal?: AbortSignal } = {},
): Promise<DatasetMapping[]> {
  return requestJson<DatasetMapping[]>('/datasets/mappings', { signal: options.signal });
}

export async function listBenchmarkPacks(
  options: { signal?: AbortSignal } = {},
): Promise<BenchmarkPack[]> {
  return requestJson<BenchmarkPack[]>('/benchmark-packs', { signal: options.signal });
}

export async function listCalibrationRuns(
  options: { signal?: AbortSignal } = {},
): Promise<CalibrationRun[]> {
  return requestJson<CalibrationRun[]>('/calibration-runs', { signal: options.signal });
}

export async function listConfidenceSnapshots(
  options: { signal?: AbortSignal } = {},
): Promise<ConfidenceSnapshot[]> {
  return requestJson<ConfidenceSnapshot[]>('/confidence-snapshots', { signal: options.signal });
}

export async function listDriftAlerts(
  options: { signal?: AbortSignal } = {},
): Promise<DriftAlert[]> {
  return requestJson<DriftAlert[]>('/drift-alerts', { signal: options.signal });
}

export async function createDemoStudy(
  actor = DEFAULT_ACTOR,
  question?: string,
  options?: {
    twinVersionIds?: string[];
    stimulusIds?: string[];
  },
): Promise<StudyBundleResponse> {
  const seedPack = await bootstrapSeedAssets();
  const twinVersionIds = options?.twinVersionIds?.length
    ? options.twinVersionIds
    : seedPack.twin_versions.map((item) => item.id);
  const stimulusIds = options?.stimulusIds?.length
    ? options.stimulusIds
    : seedPack.stimuli.map((item) => item.id);
  return requestJson<StudyBundleResponse>('/studies', {
    method: 'POST',
    body: JSON.stringify({
      business_question: question || '哪一个母婴饮品概念值得进入真实消费者验证？',
      study_type: 'concept_screening',
      brand: 'AIpersona Demo',
      category: 'Maternal beverage',
      target_groups: ['Pregnant Women', 'New Mom'],
      business_goal: {
        objective: '筛出最值得进入下一轮验证的概念',
        decision: 'winner_selection',
      },
      twin_version_ids: twinVersionIds,
      stimulus_ids: stimulusIds,
      qual_config: { mode: 'ai_idi', interviews: twinVersionIds.length * stimulusIds.length },
      quant_config: { mode: 'replica_scoring', replicas: 3 },
      generated_by: actor,
      approval_required: true,
    }),
  });
}

export function getReportDownloadUrl(studyId: string): string {
  return `${getApiBase()}/studies/${encodeURIComponent(studyId)}/report`;
}

export async function submitPlanForApproval(
  studyId: string,
  versionId: string,
  actor = DEFAULT_ACTOR,
): Promise<{ status: string }> {
  return requestJson<{ status: string }>(
    `/studies/${encodeURIComponent(studyId)}/plan-versions/${encodeURIComponent(versionId)}/submit`,
    {
      method: 'POST',
      body: JSON.stringify({ actor }),
    },
  );
}

export async function approvePlan(
  studyId: string,
  versionId: string,
  actor = DEFAULT_ACTOR,
  decisionComment = 'Approved from workbench',
): Promise<PlanVersionSummary> {
  return requestJson<PlanVersionSummary>(
    `/studies/${encodeURIComponent(studyId)}/plan-versions/${encodeURIComponent(versionId)}/approve`,
    {
      method: 'POST',
      body: JSON.stringify({
        actor,
        decision_comment: decisionComment,
      }),
    },
  );
}

export async function startRun(
  studyId: string,
  versionId: string,
  actor = DEFAULT_ACTOR,
): Promise<RunSummary> {
  return requestJson<RunSummary>(`/studies/${encodeURIComponent(studyId)}/runs`, {
    method: 'POST',
    body: JSON.stringify({
      study_plan_version_id: versionId,
      requested_by: actor,
    }),
  });
}

export async function resumeRun(
  studyId: string,
  runId: string,
  actor = DEFAULT_ACTOR,
  decisionComment = 'Continue the study run',
): Promise<RunSummary> {
  return requestJson<RunSummary>(
    `/studies/${encodeURIComponent(studyId)}/runs/${encodeURIComponent(runId)}/resume`,
    {
      method: 'POST',
      body: JSON.stringify({
        actor,
        decision_comment: decisionComment,
      }),
    },
  );
}

export async function sendChatMessage(
  studyId: string,
  message: string,
  history?: Array<{ role: string; content: string }>,
): Promise<{ reply: string }> {
  return requestJson<{ reply: string }>(
    `/studies/${encodeURIComponent(studyId)}/chat`,
    {
      method: 'POST',
      body: JSON.stringify({ message, history: history ?? [] }),
    },
  );
}

// ---------------------------------------------------------------------------
//  Agent conversation API
// ---------------------------------------------------------------------------

export type AgentMessage = {
  id: string;
  study_id: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  message_type: 'text' | 'action_request' | 'action_response' | 'progress' | 'card' | 'error';
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export async function fetchAgentMessages(
  studyId: string,
  afterId?: string,
): Promise<{ messages: AgentMessage[] }> {
  const params = afterId ? `?after=${encodeURIComponent(afterId)}` : '';
  return requestJson<{ messages: AgentMessage[] }>(
    `/studies/${encodeURIComponent(studyId)}/agent/messages${params}`,
  );
}

export async function postAgentReply(
  studyId: string,
  payload: { action_id?: string; action: string; comment?: string },
): Promise<{ status: string; reply?: string }> {
  return requestJson<{ status: string; reply?: string }>(
    `/studies/${encodeURIComponent(studyId)}/agent/reply`,
    {
      method: 'POST',
      body: JSON.stringify({
        action_id: payload.action_id ?? '',
        action: payload.action,
        comment: payload.comment,
      }),
    },
  );
}

export async function startAgent(
  studyId: string,
): Promise<{ status: string; run_id: string }> {
  return requestJson<{ status: string; run_id: string }>(
    `/studies/${encodeURIComponent(studyId)}/agent/start`,
    { method: 'POST' },
  );
}
