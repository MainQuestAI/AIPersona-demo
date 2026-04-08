import type { ContractId, ContractISODateTime, ContractJsonObject } from "./primitives.js";

export const CONSUMER_TWIN_RECORD_STATUSES = ["active", "paused", "retired"] as const;
export type ConsumerTwinRecordStatus = (typeof CONSUMER_TWIN_RECORD_STATUSES)[number];

export const TWIN_VERSION_RECORD_BENCHMARK_STATUSES = [
  "draft",
  "benchmarking",
  "qualified",
  "blocked",
  "retired",
] as const;
export type TwinVersionRecordBenchmarkStatus = (typeof TWIN_VERSION_RECORD_BENCHMARK_STATUSES)[number];

export interface ConsumerTwinRecord {
  readonly id: ContractId;
  readonly targetAudienceId: ContractId | null;
  readonly personaProfileId: ContractId | null;
  readonly businessPurpose: string;
  readonly status: ConsumerTwinRecordStatus;
  readonly applicableScenarios: ReadonlyArray<string>;
  readonly owner: string;
  readonly createdAt: ContractISODateTime;
  readonly updatedAt: ContractISODateTime;
}

export interface TwinVersionRecord {
  readonly id: ContractId;
  readonly consumerTwinId: ContractId;
  readonly versionNo: number;
  readonly personaProfileSnapshotJson: ContractJsonObject;
  readonly anchorSetId: ContractId | null;
  readonly agentConfigId: ContractId | null;
  readonly sourceLineage: ContractJsonObject;
  readonly benchmarkStatus: TwinVersionRecordBenchmarkStatus;
  readonly createdAt: ContractISODateTime;
}
