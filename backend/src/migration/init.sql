CREATE TABLE IF NOT EXISTS users (
    uid SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture TEXT,
    given_name VARCHAR(255),
    balance DECIMAL(20, 2) NOT NULL DEFAULT 0,
    claimed_cash DECIMAL(20, 7) DEFAULT 0,
    last_claim_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP - INTERVAL '25 hours',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
      
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS coins (
    cid SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(255) UNIQUE NOT NULL,
    creator_id INT NOT NULL,
    total_supply BIGINT NOT NULL DEFAULT 1000000000,
    circulating_supply DECIMAL(28, 8) NOT NULL,
    initial_price DECIMAL(36, 18) NOT NULL DEFAULT 0.000001,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(uid)
);

CREATE INDEX IF NOT EXISTS idx_coins_symbol ON coins(symbol);
CREATE INDEX IF NOT EXISTS idx_coins_creator_id ON coins(creator_id);

CREATE TABLE IF NOT EXISTS portfolios (
    pid SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    coin_id INTEGER NOT NULL REFERENCES coins(cid) ON DELETE CASCADE,
    amount DECIMAL(28, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, coin_id) 
);

CREATE TABLE IF NOT EXISTS bets (
    bid SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    bet_amount DECIMAL(20, 7) DEFAULT 0,
    bet_result VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

CREATE TABLE IF NOT EXISTS transactions (
    tid SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    coin_id INTEGER NOT NULL REFERENCES coins(cid) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL,
    amount DECIMAL(28, 8) NOT NULL,
    price_per_token DECIMAL(36, 18) NOT NULL,
    total_cost DECIMAL(36, 18) NOT NULL,
    market_price DECIMAL(36, 18) NOT NULL,
    idempotency_key VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE coins ALTER COLUMN initial_price SET DEFAULT 0.001;
ALTER TABLE coins ADD COLUMN price_multiplier DECIMAL(36,18) NOT NULL DEFAULT 0.00000001;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS token_reserve BIGINT NOT NULL DEFAULT 1000000000;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS base_reserve DECIMAL(36,18) NOT NULL DEFAULT 1000;
ALTER TABLE coins ADD COLUMN IF NOT EXISTS asset_type VARCHAR(20) NOT NULL DEFAULT 'virtual_coin';
ALTER TABLE coins ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(24) NOT NULL DEFAULT 'constant_product';
ALTER TABLE coins ADD COLUMN IF NOT EXISTS external_symbol VARCHAR(32);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS data_source VARCHAR(64);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS reference_price DECIMAL(36,18);
ALTER TABLE coins ADD COLUMN IF NOT EXISTS reference_price_updated_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_coins_external_symbol
  ON coins (external_symbol)
  WHERE external_symbol IS NOT NULL;

ALTER TABLE users ADD CONSTRAINT users_balance_nonnegative CHECK (balance >= 0);
ALTER TABLE bets ADD CONSTRAINT bets_amount_positive CHECK (bet_amount > 0);
ALTER TABLE bets ADD CONSTRAINT bets_result_valid CHECK (bet_result IN ('win', 'lose'));
ALTER TABLE coins ADD CONSTRAINT coins_token_reserve_positive CHECK (token_reserve > 0);
ALTER TABLE coins ADD CONSTRAINT coins_base_reserve_positive CHECK (base_reserve > 0);
ALTER TABLE coins ADD CONSTRAINT coins_circulating_supply_valid CHECK (circulating_supply >= 0 AND circulating_supply <= total_supply);
ALTER TABLE coins ADD CONSTRAINT coins_asset_type_valid CHECK (asset_type IN ('virtual_coin', 'market_asset'));
ALTER TABLE coins ADD CONSTRAINT coins_pricing_model_valid CHECK (pricing_model IN ('constant_product', 'reference'));
ALTER TABLE coins ADD CONSTRAINT coins_reference_price_nonnegative CHECK (reference_price IS NULL OR reference_price > 0);
ALTER TABLE coins ADD CONSTRAINT coins_market_asset_pricing_model CHECK (asset_type = 'market_asset' OR pricing_model = 'constant_product');
ALTER TABLE transactions ADD CONSTRAINT transactions_type_valid CHECK (type IN ('create', 'buy', 'sell'));
ALTER TABLE transactions ADD CONSTRAINT transactions_amount_nonnegative CHECK (amount >= 0);
ALTER TABLE transactions ADD CONSTRAINT transactions_price_nonnegative CHECK (price_per_token >= 0);
ALTER TABLE transactions ADD CONSTRAINT transactions_cost_nonnegative CHECK (total_cost >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_market_assets_provider_symbol
  ON coins (data_source, external_symbol)
  WHERE asset_type = 'market_asset'
    AND external_symbol IS NOT NULL
    AND data_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bets_user_created_at ON bets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_coin_created_at ON transactions (coin_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_idempotency ON transactions (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
