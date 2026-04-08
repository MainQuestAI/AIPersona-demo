CREATE TABLE IF NOT EXISTS target_audience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS persona_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_audience_id uuid NOT NULL REFERENCES target_audience (id) ON DELETE CASCADE,
  label text NOT NULL,
  profile_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS asset_manifest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_kind text NOT NULL,
  name text NOT NULL,
  source_format text NOT NULL,
  storage_uri text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_status text NOT NULL DEFAULT 'approved',
  created_by text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asset_manifest_kind_check
    CHECK (asset_kind IN ('qual_report', 'transcript', 'quant_dataset', 'stimulus_asset', 'benchmark_pack')),
  CONSTRAINT asset_manifest_review_status_check
    CHECK (review_status IN ('approved', 'pending_review', 'rejected'))
);

CREATE TABLE IF NOT EXISTS ingestion_job (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_manifest_id uuid NOT NULL REFERENCES asset_manifest (id) ON DELETE CASCADE,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ingestion_job_type_check
    CHECK (job_type IN ('parse', 'mapping', 'derive_stimulus')),
  CONSTRAINT ingestion_job_status_check
    CHECK (status IN ('queued', 'running', 'ready', 'failed', 'pending_review'))
);

CREATE TABLE IF NOT EXISTS dataset_schema_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_manifest_id uuid NOT NULL REFERENCES asset_manifest (id) ON DELETE CASCADE,
  mapping_status text NOT NULL DEFAULT 'pending_review',
  mapping_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by text NULL,
  review_comment text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dataset_schema_mapping_status_check
    CHECK (mapping_status IN ('pending_review', 'approved', 'rejected'))
);

CREATE TABLE IF NOT EXISTS stimulus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stimulus_type text NOT NULL,
  asset_manifest_id uuid NULL REFERENCES asset_manifest (id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  stimulus_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'ready',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stimulus_type_check
    CHECK (stimulus_type IN ('concept', 'name', 'communication_asset', 'benchmark')),
  CONSTRAINT stimulus_status_check
    CHECK (status IN ('draft', 'ready', 'archived'))
);
