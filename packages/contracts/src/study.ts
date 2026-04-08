import type { ContractId, ContractISODateTime, ContractJsonObject } from "./primitives.js";

export const STUDY_RECORD_STATUSES = ["draft", "planning", "running", "paused", "completed", "archived"] as const;
export type StudyRecordStatus = (typeof STUDY_RECORD_STATUSES)[number];

export const STUDY_PLAN_RECORD_DRAFT_STATUSES = ["idle", "drafting", "awaiting_review", "approved", "archived"] as const;
export type StudyPlanRecordDraftStatus = (typeof STUDY_PLAN_RECORD_DRAFT_STATUSES)[number];

export const STUDY_PLAN_RECORD_VERSION_STATUSES = ["draft", "active", "archived"] as const;
export type StudyPlanRecordVersionStatus = (typeof STUDY_PLAN_RECORD_VERSION_STATUSES)[number];

export const STUDY_PLAN_RECORD_APPROVAL_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "superseded",
] as const;
export type StudyPlanRecordApprovalStatus = (typeof STUDY_PLAN_RECORD_APPROVAL_STATUSES)[number];

export const STUDY_RUN_RECORD_STATUSES = [
  "queued",
  "running",
  "awaiting_midrun_approval",
  "succeeded",
  "failed",
  "cancelled",
  "replayed",
] as const;
export type StudyRunRecordStatus = (typeof STUDY_RUN_RECORD_STATUSES)[number];

export const STUDY_RUN_RECORD_TYPES = ["initial", "rerun", "replay"] as const;
export type StudyRunRecordType = (typeof STUDY_RUN_RECORD_TYPES)[number];

export const RUN_STEP_RECORD_STATUSES = ["pending", "running", "blocked", "succeeded", "failed", "skipped"] as const;
export type RunStepRecordStatus = (typeof RUN_STEP_RECORD_STATUSES)[number];

export const RUN_STEP_RECORD_TYPES = [
  "plan_generation",
  "twin_preparation",
  "qual_execution",
  "quant_execution",
  "scoring",
  "synthesis",
  "report_generation",
  "delivery",
] as const;
export type RunStepRecordType = (typeof RUN_STEP_RECORD_TYPES)[number];

export const APPROVAL_GATE_RECORD_STATUSES = ["requested", "approved", "rejected", "bypassed"] as const;
export type ApprovalGateRecordStatus = (typeof APPROVAL_GATE_RECORD_STATUSES)[number];

export const APPROVAL_RECORD_TYPES = ["plan", "midrun", "artifact", "rerun"] as const;
export type ApprovalRecordType = (typeof APPROVAL_RECORD_TYPES)[number];

export const APPROVAL_RECORD_SCOPE_TYPES = ["study_plan_version", "study_run", "run_step", "artifact", "rerun"] as const;
export type ApprovalRecordScopeType = (typeof APPROVAL_RECORD_SCOPE_TYPES)[number];

export const ARTIFACT_RECORD_STATUSES = ["pending", "ready", "failed", "archived"] as const;
export type ArtifactRecordStatus = (typeof ARTIFACT_RECORD_STATUSES)[number];

export const ARTIFACT_RECORD_TYPES = [
  "report",
  "replay",
  "presentation_export",
  "summary",
  "confidence_snapshot",
] as const;
export type ArtifactRecordType = (typeof ARTIFACT_RECORD_TYPES)[number];

export interface StudyRecord {
  readonly id: ContractId;
  readonly businessQuestion: string;
  readonly studyType: string;
  readonly brand: string;
  readonly category: string;
  readonly targetGroups: ReadonlyArray<string>;
  readonly status: StudyRecordStatus;
  readonly ownerTeamId: ContractId | null;
  readonly createdAt: ContractISODateTime;
  readonly updatedAt: ContractISODateTime;
}

export interface StudyPlanRecord {
  readonly id: ContractId;
  readonly studyId: ContractId;
  readonly currentDraftVersionId: ContractId | null;
  readonly latestApprovedVersionId: ContractId | null;
  readonly currentExecutionVersionId: ContractId | null;
  readonly draftStatus: StudyPlanRecordDraftStatus;
  readonly lastGeneratedBy: string | null;
  readonly createdAt: ContractISODateTime;
  readonly updatedAt: ContractISODateTime;
}

export interface StudyPlanVersionRecord {
  readonly id: ContractId;
  readonly studyId: ContractId;
  readonly versionNo: number;
  readonly businessGoalJson: ContractJsonObject;
  readonly twinVersionIds: ReadonlyArray<ContractId>;
  readonly stimulusIds: ReadonlyArray<ContractId>;
  readonly anchorSetId: ContractId | null;
  readonly agentConfigIds: ReadonlyArray<ContractId>;
  readonly qualConfigJson: ContractJsonObject;
  readonly quantConfigJson: ContractJsonObject;
  readonly estimatedCost: number | null;
  readonly approvalRequired: boolean;
  readonly approvalStatus: StudyPlanRecordApprovalStatus;
  readonly approvedAt: ContractISODateTime | null;
  readonly generatedBy: string | null;
  readonly status: StudyPlanRecordVersionStatus;
  readonly createdAt: ContractISODateTime;
  readonly updatedAt: ContractISODateTime;
}

export interface StudyRunRecord {
  readonly id: ContractId;
  readonly studyId: ContractId;
  readonly studyPlanVersionId: ContractId;
  readonly runType: StudyRunRecordType;
  readonly status: StudyRunRecordStatus;
  readonly workflowId: string | null;
  readonly workflowRunId: string | null;
  readonly rerunOfRunId: ContractId | null;
  readonly reuseSourceRunId: ContractId | null;
  readonly rerunFromStage: string | null;
  readonly startedAt: ContractISODateTime | null;
  readonly endedAt: ContractISODateTime | null;
  readonly createdAt: ContractISODateTime;
  readonly updatedAt: ContractISODateTime;
}

export interface RunStepRecord {
  readonly id: ContractId;
  readonly studyRunId: ContractId;
  readonly stepType: RunStepRecordType;
  readonly status: RunStepRecordStatus;
  readonly activityRef: string | null;
  readonly outputRef: string | null;
  readonly errorCode: string | null;
  readonly attemptNo: number;
  readonly approvalScope: string | null;
  readonly startedAt: ContractISODateTime | null;
  readonly endedAt: ContractISODateTime | null;
  readonly createdAt: ContractISODateTime;
  readonly updatedAt: ContractISODateTime;
}

export interface ApprovalGateRecord {
  readonly id: ContractId;
  readonly scopeType: ApprovalRecordScopeType;
  readonly scopeRefId: ContractId;
  readonly approvalType: ApprovalRecordType;
  readonly status: ApprovalGateRecordStatus;
  readonly requestedBy: string | null;
  readonly approvedBy: string | null;
  readonly decisionComment: string | null;
  readonly createdAt: ContractISODateTime;
  readonly updatedAt: ContractISODateTime;
}

export interface ArtifactRecord {
  readonly id: ContractId;
  readonly studyRunId: ContractId;
  readonly artifactType: ArtifactRecordType;
  readonly format: string;
  readonly storageUri: string;
  readonly artifactManifestJson: ContractJsonObject;
  readonly generatedBy: string | null;
  readonly status: ArtifactRecordStatus;
  readonly createdAt: ContractISODateTime;
  readonly updatedAt: ContractISODateTime;
}
