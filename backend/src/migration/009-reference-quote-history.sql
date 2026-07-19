BEGIN;

CREATE TABLE IF NOT EXISTS market_quote_history (
  qid BIGSERIAL PRIMARY KEY,
  coin_id INTEGER NOT NULL REFERENCES coins(cid) ON DELETE CASCADE,
  instrument_symbol VARCHAR(32) NOT NULL,
  source VARCHAR(64) NOT NULL,
  price DECIMAL(36, 18) NOT NULL CHECK (price > 0),
  as_of TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (coin_id, source, as_of)
);

CREATE INDEX IF NOT EXISTS idx_market_quote_history_coin_asof
  ON market_quote_history (coin_id, as_of ASC);

COMMIT;
