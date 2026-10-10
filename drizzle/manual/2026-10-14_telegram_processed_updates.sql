BEGIN;
CREATE TABLE IF NOT EXISTS telegram_processed_updates (
  update_id bigint PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS telegram_processed_updates_at_idx ON telegram_processed_updates (processed_at);
COMMIT;
