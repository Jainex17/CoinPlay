BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_market_assets_provider_symbol
  ON coins (data_source, external_symbol)
  WHERE asset_type = 'market_asset'
    AND external_symbol IS NOT NULL
    AND data_source IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coins_reference_price_nonnegative') THEN
    ALTER TABLE coins ADD CONSTRAINT coins_reference_price_nonnegative
      CHECK (reference_price IS NULL OR reference_price > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coins_market_asset_pricing_model') THEN
    ALTER TABLE coins ADD CONSTRAINT coins_market_asset_pricing_model
      CHECK (asset_type = 'market_asset' OR pricing_model = 'constant_product');
  END IF;
END $$;

COMMIT;
