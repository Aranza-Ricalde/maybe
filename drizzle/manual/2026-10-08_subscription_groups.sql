BEGIN;
CREATE TABLE IF NOT EXISTS subscription_groups (
  id bigserial PRIMARY KEY,
  family_id bigint NOT NULL REFERENCES families(id) ON DELETE RESTRICT,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS subscription_aliases (
  id bigserial PRIMARY KEY,
  family_id bigint NOT NULL REFERENCES families(id) ON DELETE RESTRICT,
  alias_key text NOT NULL,
  group_id bigint NOT NULL REFERENCES subscription_groups(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_aliases_family_key_unique ON subscription_aliases (family_id, alias_key);
COMMIT;
