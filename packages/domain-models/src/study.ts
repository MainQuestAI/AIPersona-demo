import type { EntityId, ISODateTime, JsonObject } from "./primitives.js";

export const STUDY_STATUSES = ["draft", "planning", "running", "paused", "completed", "archived"] as const;
export type StudyStatus = (typeof STUDY_STATUSES)[number];

export const STUDY_PLAN_DRAFT_STATUSES = ["idle", "drafting", "awaiting_review", "approved", "archived"] as const;
export type StudyPlanDraftStatus = (typeof STUDY_PLAN_DRAFT_STATUSES)[number];

export const STUDY_PLAN_VERSION_STATUSES = ["draft", "active", "archived"] as const;
export type StudyPlanVersionStatus = (typeof STUDY_PLAN_VERSION_STATUSES)[number];

export const STUDY_PLAN_VERSION_APPROVAL_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "superseded",
] as const;
export type StudyPlanVersionApprovalStatus = (typeof STUDY_PLAN_VERSION_APPROVAL_STATUSES)[number];

export const STUDY_RUN_STATUSES = [
  "queued",
  "running",
  "awaiting_midrun_approval",
  "succeeded",
  "failed",
  "cancelled",
  "replayed",
] as const;
export type StudyRunStatus = (typeof STUDY_RUN_STATUSES)[number];

export const STUDY_RUN_TYPES = ["initial", "rerun", "replay"] as const;
export type StudyRunType = (typeof STUDY_RUN_TYPES)[number];

export const RUN_STEP_STATUSES = ["pending", "running", "blocked", "succeeded", "failed", "skipped"] as const;
export type RunStepStatus = (typeof RUN_STEP_STATUSES)[number];

export const RUN_STEP_TYPES = [
  "plan_generation",
  "twin_preparation",
  "qual_execution",
  "quant_execution",
  "scoring",
  "synthesis",
  "report_generation",
  "delivery",
] as const;
export type RunStepType = (typeof RUN_STEP_TYPES)[number];

export const APPROVAL_GATE_STATUSES = ["requested", "approved", "rejected", "bypassed"] as const;
export type ApprovalGateStatus = (typeof APPROVAL_GATE_STATUSES)[number];

export const APPROVAL_TYPES = ["plan", "midrun", "artifact", "rerun"] as const;
export type ApprovalType = (typeof APPROVAL_TYPES)[number];

export const APPROVAL_SCOPE_TYPES = ["study_plan_version", "study_run", "run_step", "artifact", "rerun"] as const;
export type ApprovalScopeType = (typeof APPROVAL_SCOPE_TYPES)[number];

export const ARTIFACT_STATUSES = ["pending", "ready", "failed", "archived"] as const;
export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number];

export const ARTIFACT_TYPES = [
  "report",
  "replay",
  "presentation_export",
  "summary",
  "confidence_snapshot",
] as const;
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export interface Study {
  readonly id: EntityId;
  readonly businessQuestion: string;
  readonly studyType: string;
  readonly brand: string;
  readonly category: string;
  readonly targetGroups: ReadonlyArray<string>;
  readonly status: StudyStatus;
  readonly ownerTeamId: EntityId | null;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface StudyPlan {
  readonly id: EntityId;
  readonly studyId: EntityId;
  readonly currentDraftVersionId: EntityId | null;
  readonly latestApprovedVersionId: EntityId | null;
  readonly currentExecutionVersionId: EntityId | null;
  readonly draftStatus: StudyPlanDraftStatus;
  readonly lastGeneratedBy: string | null;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface StudyPlanVersion {
  readonly id: EntityId;
  readonly studyId: EntityId;
  readonly versionNo: number;
  readonly businessGoalJson: JsonObject;
  readonly twinVersionIds: ReadonlyArray<EntityId>;
  readonly stimulusIds: ReadonlyArray<EntityId>;
  readonly anchorSetId: EntityId | null;
  readonly agentConfigIds: ReadonlyArray<EntityId>;
  readonly qualConfigJson: JsonObject;
  readonly quantConfigJson: JsonObject;
  readonly estimatedCost: number | null;
  readonly approvalRequired: boolean;
  readonly approvalStatus: StudyPlanVersionApprovalStatus;
  readonly approvedAt: ISODateTime | null;
  readonly generatedBy: string | null;
  readonly status: StudyPlanVersionStatus;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface StudyRun {
  readonly id: EntityId;
  readonly studyId: EntityId;
  readonly studyPlanVersionId: EntityId;
  readonly runType: StudyRunType;
  readonly status: StudyRunStatus;
  readonly workflowId: string | null;
  readonly workflowRunId: string | null;
  readonly rerunOfRunId: EntityId | null;
  readonly reuseSourceRunId: EntityId | null;
  readonly rerunFromStage: string | null;
  readonly startedAt: ISODateTime | null;
  readonly endedAt: ISODateTime | null;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface RunStep {
  readonly id: EntityId;
  readonly studyRunId: EntityId;
  readonly stepType: RunStepType;
  readonly status: RunStepStatus;
  readonly activityRef: string | null;
  readonly outputRef: string | null;
  readonly errorCode: string | null;
  readonly attemptNo: number;
  readonly approvalScope: string | null;
  readonly startedAt: ISODateTime | null;
  readonly endedAt: ISODateTime | null;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface ApprovalGate {
  readonly id: EntityId;
  readonly scopeType: ApprovalScopeType;
  readonly scopeRefId: EntityId;
  readonly approvalType: ApprovalType;
  readonly status: ApprovalGateStatus;
  readonly requestedBy: string | null;
  readonly approvedBy: string | null;
  readonly decisionComment: string | null;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface Artifact {
  readonly id: EntityId;
  readonly studyRunId: EntityId;
  readonly artifactType: ArtifactType;
  readonly format: string;
  readonly storageUri: string;
  readonly artifactManifestJson: JsonObject;
  readonly generatedBy: string | null;
  readonly status: ArtifactStatus;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}
