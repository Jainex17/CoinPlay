BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_type_valid') THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_type_valid
      CHECK (type IN ('create', 'buy', 'sell'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_amount_nonnegative') THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_amount_nonnegative
      CHECK (amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_price_nonnegative') THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_price_nonnegative
      CHECK (price_per_token >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_cost_nonnegative') THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_cost_nonnegative
      CHECK (total_cost >= 0);
  END IF;
END $$;

COMMIT;
