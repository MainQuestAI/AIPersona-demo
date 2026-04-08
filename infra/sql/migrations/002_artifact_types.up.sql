-- Expand artifact_type to support AI-generated research outputs
ALTER TABLE artifact DROP CONSTRAINT IF EXISTS artifact_artifact_type_check;
ALTER TABLE artifact ADD CONSTRAINT artifact_artifact_type_check
  CHECK (artifact_type IN (
    'report', 'replay', 'presentation_export', 'summary', 'confidence_snapshot',
    'qual_transcript', 'quant_ranking', 'recommendation'
  ));
