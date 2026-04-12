-- API key authentication
CREATE TABLE IF NOT EXISTS api_key (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash    text NOT NULL UNIQUE,
  key_prefix  text NOT NULL,  -- first 8 chars for display (e.g. "aip_xxxx...")
  owner       text NOT NULL DEFAULT 'default',
  scope       text NOT NULL DEFAULT 'api' CHECK (scope IN ('api', 'admin')),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  expires_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_api_key_hash ON api_key(key_hash) WHERE is_active = true;
