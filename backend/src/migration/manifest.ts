export const requiredMigrations = [
  '002-production-hardening.sql',
  '003-trading-cents-and-market-price.sql',
  '004-idempotent-trades.sql',
  '005-market-asset-boundary.sql',
  '006-transaction-invariants.sql',
  '007-fractional-reference-shares.sql',
  '008-reference-asset-invariants.sql',
  '009-reference-quote-history.sql',
  '010-ledger-nullability.sql',
] as const;
