BEGIN;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS import_hash text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reconciled boolean NOT NULL DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS posted_date date;
CREATE UNIQUE INDEX IF NOT EXISTS transactions_account_import_hash_unique ON transactions (account_id, import_hash) WHERE import_hash IS NOT NULL;

ALTER TABLE imports ADD COLUMN IF NOT EXISTS bank text;
ALTER TABLE imports ADD COLUMN IF NOT EXISTS account_id bigint REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE imports ADD COLUMN IF NOT EXISTS account_last4 text;
ALTER TABLE imports ADD COLUMN IF NOT EXISTS period_start date;
ALTER TABLE imports ADD COLUMN IF NOT EXISTS period_end date;
ALTER TABLE imports ADD COLUMN IF NOT EXISTS transaction_count integer;
ALTER TABLE imports ADD COLUMN IF NOT EXISTS linked_count integer;
ALTER TABLE imports ADD COLUMN IF NOT EXISTS metadata jsonb;
COMMIT;
