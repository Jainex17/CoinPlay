BEGIN;

ALTER TABLE portfolios
  ALTER COLUMN amount TYPE DECIMAL(28, 8) USING amount::DECIMAL(28, 8);

ALTER TABLE transactions
  ALTER COLUMN amount TYPE DECIMAL(28, 8) USING amount::DECIMAL(28, 8);

ALTER TABLE coins
  ALTER COLUMN circulating_supply TYPE DECIMAL(28, 8) USING circulating_supply::DECIMAL(28, 8);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'portfolios_amount_nonnegative') THEN
    ALTER TABLE portfolios ADD CONSTRAINT portfolios_amount_nonnegative CHECK (amount >= 0);
  END IF;
END $$;

COMMIT;
