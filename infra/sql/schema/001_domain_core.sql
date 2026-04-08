-- R02 core domain schema snapshot
-- This snapshot keeps the version binding explicit:
-- study -> study_plan -> study_plan_version -> study_run

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS study (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_question text NOT NULL,
  study_type text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL,
  target_groups text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'draft',
  owner_team_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_status_check
    CHECK (status IN ('draft', 'planning', 'running', 'paused', 'completed', 'archived'))
);

CREATE TABLE IF NOT EXISTS consumer_twin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_audience_id uuid NULL,
  persona_profile_id uuid NULL,
  business_purpose text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  applicable_scenarios text[] NOT NULL DEFAULT '{}'::text[],
  owner text NOT NULL DEFAULT 'Danone',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consumer_twin_status_check
    CHECK (status IN ('active', 'paused', 'retired'))
);

CREATE TABLE IF NOT EXISTS twin_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_twin_id uuid NOT NULL,
  version_no integer NOT NULL,
  persona_profile_snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  anchor_set_id uuid NULL,
  agent_config_id uuid NULL,
  source_lineage jsonb NOT NULL DEFAULT '{}'::jsonb,
  benchmark_status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT twin_version_version_no_check CHECK (version_no > 0),
  CONSTRAINT twin_version_benchmark_status_check
    CHECK (benchmark_status IN ('draft', 'benchmarking', 'qualified', 'blocked', 'retired')),
  CONSTRAINT twin_version_consumer_twin_version_no_unique UNIQUE (consumer_twin_id, version_no),
  CONSTRAINT twin_version_consumer_twin_id_fk
    FOREIGN KEY (consumer_twin_id) REFERENCES consumer_twin (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_plan_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL,
  version_no integer NOT NULL,
  business_goal_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  twin_version_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  stimulus_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  anchor_set_id uuid NULL,
  agent_config_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  qual_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  quant_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_cost numeric(12, 2) NULL,
  approval_required boolean NOT NULL DEFAULT true,
  approval_status text NOT NULL DEFAULT 'draft',
  approved_at timestamptz NULL,
  generated_by text NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_plan_version_version_no_check CHECK (version_no > 0),
  CONSTRAINT study_plan_version_estimated_cost_check CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  CONSTRAINT study_plan_version_approval_status_check
    CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected', 'superseded')),
  CONSTRAINT study_plan_version_status_check
    CHECK (status IN ('draft', 'active', 'archived')),
  CONSTRAINT study_plan_version_study_version_unique UNIQUE (study_id, id),
  CONSTRAINT study_plan_version_study_version_no_unique UNIQUE (study_id, version_no),
  CONSTRAINT study_plan_version_study_id_fk
    FOREIGN KEY (study_id) REFERENCES study (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL,
  current_draft_version_id uuid NULL,
  latest_approved_version_id uuid NULL,
  current_execution_version_id uuid NULL,
  draft_status text NOT NULL DEFAULT 'idle',
  last_generated_by text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_plan_draft_status_check
    CHECK (draft_status IN ('idle', 'drafting', 'awaiting_review', 'approved', 'archived')),
  CONSTRAINT study_plan_study_id_unique UNIQUE (study_id),
  CONSTRAINT study_plan_study_id_fk
    FOREIGN KEY (study_id) REFERENCES study (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_run (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL,
  study_plan_version_id uuid NOT NULL,
  run_type text NOT NULL DEFAULT 'initial',
  status text NOT NULL DEFAULT 'queued',
  workflow_id text NULL,
  workflow_run_id text NULL,
  rerun_of_run_id uuid NULL,
  reuse_source_run_id uuid NULL,
  rerun_from_stage text NULL,
  started_at timestamptz NULL,
  ended_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_run_run_type_check CHECK (run_type IN ('initial', 'rerun', 'replay')),
  CONSTRAINT study_run_status_check
    CHECK (status IN ('queued', 'running', 'awaiting_midrun_approval', 'succeeded', 'failed', 'cancelled', 'replayed')),
  CONSTRAINT study_run_study_id_fk
    FOREIGN KEY (study_id) REFERENCES study (id) ON DELETE CASCADE,
  CONSTRAINT study_run_rerun_of_run_id_fk
    FOREIGN KEY (rerun_of_run_id) REFERENCES study_run (id) ON DELETE SET NULL,
  CONSTRAINT study_run_reuse_source_run_id_fk
    FOREIGN KEY (reuse_source_run_id) REFERENCES study_run (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS run_step (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_run_id uuid NOT NULL,
  step_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  activity_ref text NULL,
  output_ref text NULL,
  error_code text NULL,
  attempt_no integer NOT NULL DEFAULT 1,
  approval_scope text NULL,
  started_at timestamptz NULL,
  ended_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT run_step_step_type_check
    CHECK (step_type IN ('plan_generation', 'twin_preparation', 'qual_execution', 'quant_execution', 'scoring', 'synthesis', 'report_generation', 'delivery')),
  CONSTRAINT run_step_status_check CHECK (status IN ('pending', 'running', 'blocked', 'succeeded', 'failed', 'skipped')),
  CONSTRAINT run_step_attempt_no_check CHECK (attempt_no > 0),
  CONSTRAINT run_step_unique_attempt UNIQUE (study_run_id, step_type, attempt_no),
  CONSTRAINT run_step_study_run_id_fk
    FOREIGN KEY (study_run_id) REFERENCES study_run (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS approval_gate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL,
  scope_ref_id uuid NOT NULL,
  approval_type text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  requested_by text NULL,
  approved_by text NULL,
  decision_comment text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT approval_gate_scope_type_check
    CHECK (scope_type IN ('study_plan_version', 'study_run', 'run_step', 'artifact', 'rerun')),
  CONSTRAINT approval_gate_approval_type_check CHECK (approval_type IN ('plan', 'midrun', 'artifact', 'rerun')),
  CONSTRAINT approval_gate_status_check CHECK (status IN ('requested', 'approved', 'rejected', 'bypassed'))
);

CREATE TABLE IF NOT EXISTS artifact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_run_id uuid NOT NULL,
  artifact_type text NOT NULL,
  format text NOT NULL,
  storage_uri text NOT NULL,
  artifact_manifest_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by text NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT artifact_artifact_type_check
    CHECK (artifact_type IN ('report', 'replay', 'presentation_export', 'summary', 'confidence_snapshot')),
  CONSTRAINT artifact_status_check CHECK (status IN ('pending', 'ready', 'failed', 'archived')),
  CONSTRAINT artifact_study_run_id_fk
    FOREIGN KEY (study_run_id) REFERENCES study_run (id) ON DELETE CASCADE
);

ALTER TABLE study_plan
  ADD CONSTRAINT study_plan_current_draft_version_fk
    FOREIGN KEY (study_id, current_draft_version_id) REFERENCES study_plan_version (study_id, id);

ALTER TABLE study_plan
  ADD CONSTRAINT study_plan_latest_approved_version_fk
    FOREIGN KEY (study_id, latest_approved_version_id) REFERENCES study_plan_version (study_id, id);

ALTER TABLE study_plan
  ADD CONSTRAINT study_plan_current_execution_version_fk
    FOREIGN KEY (study_id, current_execution_version_id) REFERENCES study_plan_version (study_id, id);

ALTER TABLE study_run
  ADD CONSTRAINT study_run_plan_version_fk
    FOREIGN KEY (study_id, study_plan_version_id) REFERENCES study_plan_version (study_id, id);
