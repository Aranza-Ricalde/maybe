-- Decisión del usuario: ¿un recurrente cuenta en el presupuesto? + política de la familia para los recurrentes nuevos.
-- Texto libre y nullable: sus valores válidos viven en src/domain/recurring/budgetInclusion.ts (sin enums ni CHECK).
-- null en recurring_items.budget_inclusion = sin decidir (cuenta como siempre, no cambia ninguna cifra).
-- null en families.recurring_budget_policy = preguntar.
-- Solo agrega columnas nullable: no modifica ni borra datos existentes. Aplicar este script, NO `pnpm db:push`.
-- IMPORTANTE: aplicarlo ANTES de desplegar el código nuevo (las consultas de recurrentes y familias leen estas columnas).

BEGIN;

ALTER TABLE recurring_items ADD COLUMN IF NOT EXISTS budget_inclusion text;
ALTER TABLE families ADD COLUMN IF NOT EXISTS recurring_budget_policy text;

COMMIT;
