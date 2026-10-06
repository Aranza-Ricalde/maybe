BEGIN;
CREATE TABLE IF NOT EXISTS api_tokens (
  family_id bigint PRIMARY KEY REFERENCES families(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE,
  last_four text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
COMMIT;
