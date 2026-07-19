BEGIN;

ALTER TABLE coins
  ADD COLUMN IF NOT EXISTS asset_type VARCHAR(20) NOT NULL DEFAULT 'virtual_coin',
  ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(24) NOT NULL DEFAULT 'constant_product',
  ADD COLUMN IF NOT EXISTS external_symbol VARCHAR(32),
  ADD COLUMN IF NOT EXISTS data_source VARCHAR(64),
  ADD COLUMN IF NOT EXISTS reference_price DECIMAL(36, 18),
  ADD COLUMN IF NOT EXISTS reference_price_updated_at TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coins_asset_type_valid') THEN
    ALTER TABLE coins ADD CONSTRAINT coins_asset_type_valid
      CHECK (asset_type IN ('virtual_coin', 'market_asset'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coins_pricing_model_valid') THEN
    ALTER TABLE coins ADD CONSTRAINT coins_pricing_model_valid
      CHECK (pricing_model IN ('constant_product', 'reference'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coins_external_symbol
  ON coins (external_symbol)
  WHERE external_symbol IS NOT NULL;

COMMIT;
