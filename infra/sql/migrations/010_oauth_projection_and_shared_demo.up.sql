ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS auth_user_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS auth_provider text,
  ADD COLUMN IF NOT EXISTS last_auth_at timestamptz,
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_email_key;
CREATE INDEX IF NOT EXISTS idx_app_user_email ON app_user(email);

ALTER TABLE team
  ADD COLUMN IF NOT EXISTS is_shared_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_team_shared_demo ON team(is_shared_demo);

ALTER TABLE app_session
  ADD COLUMN IF NOT EXISTS session_type text NOT NULL DEFAULT 'oauth',
  ADD COLUMN IF NOT EXISTS created_by_auth_user_id text;

ALTER TABLE app_session DROP CONSTRAINT IF EXISTS app_session_session_type_check;
ALTER TABLE app_session
  ADD CONSTRAINT app_session_session_type_check
  CHECK (session_type IN ('oauth', 'dev'));
