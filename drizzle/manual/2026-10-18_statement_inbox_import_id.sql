BEGIN;
ALTER TABLE statement_inbox ADD COLUMN IF NOT EXISTS import_id bigint;
COMMIT;
