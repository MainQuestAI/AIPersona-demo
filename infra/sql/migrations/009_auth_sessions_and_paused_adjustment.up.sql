CREATE TABLE IF NOT EXISTS app_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_session_user_id ON app_session(user_id);
CREATE INDEX IF NOT EXISTS idx_app_session_token_hash_active
  ON app_session(token_hash)
  WHERE revoked_at IS NULL;

ALTER TABLE study_run DROP CONSTRAINT IF EXISTS study_run_status_check;
ALTER TABLE study_run
  ADD CONSTRAINT study_run_status_check
  CHECK (status IN ('queued', 'running', 'awaiting_midrun_approval', 'paused_for_adjustment', 'succeeded', 'failed', 'cancelled', 'replayed'));
