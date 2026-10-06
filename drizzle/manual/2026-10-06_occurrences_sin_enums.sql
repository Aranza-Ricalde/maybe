-- Probado en la rama de Neon `test-occurrences-sin-enums` (br-delicate-fog-b4mo7sh6) con una copia de los datos reales.
-- NO aplicado en producción. Aplicar este script, NO `pnpm db:push` (push además renombra ~20 constraints; ver notas del PR).
--
-- 1) Tabla nueva recurring_occurrences: única fuente de "pagado". Estado y origen del match son texto libre en la
--    base; sus valores válidos viven en src/domain/recurring/rules.ts.
-- 2) Quita los 14 CHECK de listas de valores: esas listas se validan en el back (src/domain/*/rules.ts).
--    Solo se retira la validación de la base; no se modifica ningún dato.

BEGIN;

CREATE TABLE recurring_occurrences (
  id                    bigserial PRIMARY KEY,
  family_id             bigint NOT NULL REFERENCES families(id) ON DELETE RESTRICT,
  recurring_item_id     bigint NOT NULL REFERENCES recurring_items(id) ON DELETE CASCADE,
  expected_date         date   NOT NULL,
  expected_amount_cents bigint NOT NULL,
  status                text   NOT NULL,
  transaction_id        bigint REFERENCES transactions(id) ON DELETE SET NULL,
  match_source          text,
  match_score           integer,
  matched_at            timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recurring_occurrences_item_date_unique UNIQUE (recurring_item_id, expected_date)
);
-- Un movimiento solo puede pagar una ocurrencia; las ocurrencias sin movimiento no compiten entre sí.
CREATE UNIQUE INDEX recurring_occurrences_transaction_unique
  ON recurring_occurrences (transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX recurring_occurrences_family_date_idx
  ON recurring_occurrences (family_id, expected_date);

ALTER TABLE accounts                  DROP CONSTRAINT accounts_type_check;
ALTER TABLE budget_category_settings  DROP CONSTRAINT budget_category_settings_cadence_check;
ALTER TABLE categories                DROP CONSTRAINT categories_classification_check;
ALTER TABLE concept_match_suggestions DROP CONSTRAINT concept_match_suggestions_status_check;
ALTER TABLE concepts                  DROP CONSTRAINT concepts_flow_check;
ALTER TABLE imports                   DROP CONSTRAINT imports_status_check;
ALTER TABLE recurring_candidates      DROP CONSTRAINT recurring_candidates_status_check;
ALTER TABLE recurring_items           DROP CONSTRAINT recurring_items_flow_check;
ALTER TABLE recurring_items           DROP CONSTRAINT recurring_items_status_check;
ALTER TABLE scheduled_transactions    DROP CONSTRAINT scheduled_transactions_status_check;
ALTER TABLE transactions              DROP CONSTRAINT transactions_kind_check;
ALTER TABLE transactions              DROP CONSTRAINT transactions_source_check;
ALTER TABLE transactions              DROP CONSTRAINT transactions_status_check;
ALTER TABLE valuations                DROP CONSTRAINT valuations_source_check;

COMMIT;
