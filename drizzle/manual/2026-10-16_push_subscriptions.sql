BEGIN;
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL,
  family_id bigint NOT NULL REFERENCES families(id) ON DELETE RESTRICT,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_family_idx ON push_subscriptions (family_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions (user_id);
COMMIT;
