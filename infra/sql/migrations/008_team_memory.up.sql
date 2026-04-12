-- Extend study_memory with team-level sharing
ALTER TABLE study_memory ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES team(id);
ALTER TABLE study_memory ADD COLUMN IF NOT EXISTS is_team_shared boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_study_memory_team
  ON study_memory(team_id, memory_type, extracted_at DESC)
  WHERE team_id IS NOT NULL;
