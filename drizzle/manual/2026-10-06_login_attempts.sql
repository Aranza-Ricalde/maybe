-- Intentos fallidos de login para el límite persistente. Solo agrega una tabla; no toca datos.
BEGIN;

CREATE TABLE IF NOT EXISTS login_attempts (
  id           bigserial PRIMARY KEY,
  attempt_key  text NOT NULL,
  attempted_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS login_attempts_key_time_idx ON login_attempts (attempt_key, attempted_at);

COMMIT;
