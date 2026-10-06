-- Naturaleza del gasto de una categoría (esencial / discrecional). Texto libre y nullable: sus valores válidos viven en
-- src/domain/categories/nature.ts (sin enums ni CHECK en la base). null = sin clasificar.
-- Solo agrega una columna nullable: no modifica ni borra datos existentes y es seguro sobre una tabla en uso.
-- Aplicar este script, NO `pnpm db:push` (renombra constraints). IMPORTANTE: aplicarlo ANTES de desplegar el código nuevo,
-- porque las consultas de categorías leen esta columna.

BEGIN;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS spending_nature text;

COMMIT;
