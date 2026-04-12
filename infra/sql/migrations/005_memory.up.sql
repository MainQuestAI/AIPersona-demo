-- Study memory: persistent findings extracted from completed studies
CREATE TABLE IF NOT EXISTS study_memory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id        uuid NOT NULL REFERENCES study(id),
  memory_type     text NOT NULL CHECK (memory_type IN (
    'theme',               -- recurring qualitative theme
    'preference',          -- user/brand preference
    'insight',             -- actionable insight
    'brand_positioning',   -- brand positioning observation
    'segment_finding'      -- segment-specific finding
  )),
  key             text NOT NULL,
  value           text NOT NULL,
  confidence      numeric(3,2) DEFAULT 0.80,
  extracted_at    timestamptz NOT NULL DEFAULT now(),
  superseded_by   uuid NULL REFERENCES study_memory(id)
);

CREATE INDEX IF NOT EXISTS idx_study_memory_study
  ON study_memory(study_id, extracted_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_memory_type
  ON study_memory(memory_type, extracted_at DESC);
