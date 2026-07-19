BEGIN;

ALTER TABLE users
  ALTER COLUMN balance TYPE DECIMAL(20, 2) USING balance::DECIMAL(20, 2);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS market_price DECIMAL(36, 18);

UPDATE transactions
SET market_price = price_per_token
WHERE market_price IS NULL;

ALTER TABLE transactions
  ALTER COLUMN market_price SET NOT NULL;

COMMIT;
