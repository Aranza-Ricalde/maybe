BEGIN;
CREATE TABLE IF NOT EXISTS telegram_drafts (
  id bigserial PRIMARY KEY,
  chat_id text NOT NULL,
  family_id bigint NOT NULL REFERENCES families(id) ON DELETE RESTRICT,
  type text NOT NULL,
  amount_cents bigint NOT NULL,
  description text NOT NULL,
  date text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS telegram_drafts_chat_idx ON telegram_drafts (chat_id);
COMMIT;
