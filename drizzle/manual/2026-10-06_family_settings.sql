-- Preferencias de la familia (por ahora: el saldo mínimo para el aviso de la proyección). Una fila por familia, todo opcional:
-- sin fila o con null, la app usa su valor por defecto ($0). Es una tabla NUEVA: no modifica ni borra nada existente.
-- Aplicar este script, NO `pnpm db:push` (renombra constraints). Hasta que se aplique, la app sigue funcionando con el valor por defecto
-- (la lectura tolera que la tabla aún no exista); solo guardar un saldo mínimo exige que la tabla esté creada.

BEGIN;

CREATE TABLE IF NOT EXISTS family_settings (
  family_id             bigint PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
  minimum_balance_cents bigint,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

COMMIT;
