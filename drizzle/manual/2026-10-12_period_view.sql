BEGIN;
ALTER TABLE family_settings ADD COLUMN IF NOT EXISTS period_view text;
COMMIT;
