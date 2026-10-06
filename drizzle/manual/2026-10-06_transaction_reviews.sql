-- Decisiones del usuario al revisar movimientos (p. ej. "esto NO es una transferencia"), para no volver a preguntarle.
-- Solo estructura: tema y decisión son texto libre; sus valores válidos viven en src/domain/transfers/rules.ts (sin enums en la base).
-- Es una tabla nueva: no modifica ni borra nada existente. Aplicar este script, NO `pnpm db:push` (renombra constraints).

BEGIN;

CREATE TABLE transaction_reviews (
  id             bigserial PRIMARY KEY,
  family_id      bigint NOT NULL REFERENCES families(id) ON DELETE RESTRICT,
  transaction_id bigint NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  topic          text   NOT NULL,
  decision       text   NOT NULL,
  decided_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX transaction_reviews_transaction_topic_unique
  ON transaction_reviews (transaction_id, topic);

COMMIT;
