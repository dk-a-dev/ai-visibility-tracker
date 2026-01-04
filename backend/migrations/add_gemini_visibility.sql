-- Add gemini_visibility column to metrics_cache table
ALTER TABLE metrics_cache 
ADD COLUMN IF NOT EXISTS gemini_visibility NUMERIC(5, 2);

-- Add comment to the column
COMMENT ON COLUMN metrics_cache.gemini_visibility IS 'Visibility score for Google Gemini platform';
