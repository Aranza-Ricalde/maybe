-- Índices por familia para las tablas que se consultan siempre filtradas por family_id.
-- Solo agrega índices (no toca datos). Aplicar este script, NO `pnpm db:push`.
-- Probado en la rama de prueba; NO aplicado en producción.

BEGIN;

CREATE INDEX IF NOT EXISTS accounts_family_idx ON accounts (family_id);
CREATE INDEX IF NOT EXISTS categories_family_idx ON categories (family_id);
CREATE INDEX IF NOT EXISTS goals_family_idx ON goals (family_id);
CREATE INDEX IF NOT EXISTS recurring_items_family_idx ON recurring_items (family_id);
CREATE INDEX IF NOT EXISTS scheduled_transactions_family_idx ON scheduled_transactions (family_id);

COMMIT;
