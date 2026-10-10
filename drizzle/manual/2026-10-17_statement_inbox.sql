BEGIN;
CREATE TABLE IF NOT EXISTS statement_inbox (
  id bigserial PRIMARY KEY,
  family_id bigint NOT NULL REFERENCES families(id) ON DELETE RESTRICT,
  bank text NOT NULL,
  account_id bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  filename text NOT NULL,
  content_hash text NOT NULL,
  size_bytes integer NOT NULL,
  data bytea NOT NULL,
  from_address text,
  subject text,
  received_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS statement_inbox_family_hash_uidx ON statement_inbox (family_id, content_hash);
CREATE INDEX IF NOT EXISTS statement_inbox_family_status_idx ON statement_inbox (family_id, status);
COMMIT;
