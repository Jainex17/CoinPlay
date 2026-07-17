-- Apply this migration once to every existing production database before deployment.
-- It refuses to add constraints if historical data violates them; fix that data first.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_balance_nonnegative') THEN
    ALTER TABLE users ADD CONSTRAINT users_balance_nonnegative CHECK (balance >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bets_amount_positive') THEN
    ALTER TABLE bets ADD CONSTRAINT bets_amount_positive CHECK (bet_amount > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bets_result_valid') THEN
    ALTER TABLE bets ADD CONSTRAINT bets_result_valid CHECK (bet_result IN ('win', 'lose'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coins_token_reserve_positive') THEN
    ALTER TABLE coins ADD CONSTRAINT coins_token_reserve_positive CHECK (token_reserve > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coins_base_reserve_positive') THEN
    ALTER TABLE coins ADD CONSTRAINT coins_base_reserve_positive CHECK (base_reserve > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coins_circulating_supply_valid') THEN
    ALTER TABLE coins ADD CONSTRAINT coins_circulating_supply_valid CHECK (circulating_supply >= 0 AND circulating_supply <= total_supply);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bets_user_created_at ON bets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_coin_created_at ON transactions (coin_id, created_at DESC);

COMMIT;
