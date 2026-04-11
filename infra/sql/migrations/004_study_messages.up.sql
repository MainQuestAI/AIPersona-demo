-- Agent-driven conversation messages for studies
CREATE TABLE IF NOT EXISTS study_message (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id      uuid NOT NULL REFERENCES study(id),
  role          text NOT NULL CHECK (role IN ('agent', 'user', 'system')),
  content       text NOT NULL DEFAULT '',
  message_type  text NOT NULL DEFAULT 'text'
    CHECK (message_type IN (
      'text',
      'action_request',
      'action_response',
      'progress',
      'card',
      'error'
    )),
  metadata_json jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_message_study_created
  ON study_message(study_id, created_at);
