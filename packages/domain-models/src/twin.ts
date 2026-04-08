import type { EntityId, ISODateTime, JsonObject } from "./primitives.js";

export const CONSUMER_TWIN_STATUSES = ["active", "paused", "retired"] as const;
export type ConsumerTwinStatus = (typeof CONSUMER_TWIN_STATUSES)[number];

export const TWIN_VERSION_BENCHMARK_STATUSES = [
  "draft",
  "benchmarking",
  "qualified",
  "blocked",
  "retired",
] as const;
export type TwinVersionBenchmarkStatus = (typeof TWIN_VERSION_BENCHMARK_STATUSES)[number];

export interface ConsumerTwin {
  readonly id: EntityId;
  readonly targetAudienceId: EntityId | null;
  readonly personaProfileId: EntityId | null;
  readonly businessPurpose: string;
  readonly status: ConsumerTwinStatus;
  readonly applicableScenarios: ReadonlyArray<string>;
  readonly owner: string;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface TwinVersion {
  readonly id: EntityId;
  readonly consumerTwinId: EntityId;
  readonly versionNo: number;
  readonly personaProfileSnapshotJson: JsonObject;
  readonly anchorSetId: EntityId | null;
  readonly agentConfigId: EntityId | null;
  readonly sourceLineage: JsonObject;
  readonly benchmarkStatus: TwinVersionBenchmarkStatus;
  readonly createdAt: ISODateTime;
}
