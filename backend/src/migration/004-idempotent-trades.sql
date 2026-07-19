BEGIN;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_idempotency
  ON transactions (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMIT;
