<div align="center">

<img src="frontend/src/assets/coinfront.png" alt="CoinPlay Logo" width="150" height="150">

# CoinPlay

Virtual coin trading platform

</div>

## About

highly inspired by [RugPlay](https://rugplay.com/) by [FaceDevStuff](https://www.youtube.com/@FaceDevStuff)

claim your virtal money spend of gambling or buy and sell virtal coins.

## Features

- **Coin Flip Game** - The classic heads or tails, but make it crypto
- **Daily Reward** - Every 12h you can claim a reward
- **User Authentication** - Secure login system to track your gaming history  
- **Betting History** - Complete record of all your gaming sessions
- **Buy and Sell** - Buy and sell virtual coins

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL

## Production setup

For a new database, apply `backend/src/migration/init.sql` once. For an existing database, use the migration runner before deploying:

```sh
pnpm --dir backend run migrate
```

The runner takes a PostgreSQL advisory lock, applies numbered migrations in order, records SHA-256 checksums, and refuses to continue if an already-applied migration was edited. The numbered migration files are:

1. `backend/src/migration/002-production-hardening.sql`.
2. `backend/src/migration/003-trading-cents-and-market-price.sql`.
3. `backend/src/migration/004-idempotent-trades.sql`.
4. `backend/src/migration/005-market-asset-boundary.sql`.
5. `backend/src/migration/006-transaction-invariants.sql`.
6. `backend/src/migration/007-fractional-reference-shares.sql`.
7. `backend/src/migration/008-reference-asset-invariants.sql`.
8. `backend/src/migration/009-reference-quote-history.sql`.
9. `backend/src/migration/010-ledger-nullability.sql`.

Set `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL` in production. `DB_POOL_MAX` is optional and defaults to 50; `DB_CONNECTION_TIMEOUT_MS` defaults to 30 seconds; `REFERENCE_QUOTE_MAX_AGE_SECONDS` defaults to 300 seconds. Trades for the same coin are serialized by a PostgreSQL row lock so concurrent orders cannot overwrite pool reserves; different coins can execute concurrently. Keep the pool size within the connection limit of the hosted PostgreSQL plan.

The backend can be built as a non-root container with `docker build -t coinplay-api ./backend` and run with the production environment variables. CI runs backend tests and frontend lint/build on every pull request and push to `main`.

Buy and sell requests accept an `Idempotency-Key` header. The web client sends one automatically, and API clients should reuse the same key when retrying a request after a timeout.

Before launch, run the database lock benchmark against a staging database:

```sh
BENCHMARK_COIN_SYMBOL=DEMO pnpm --dir backend run benchmark:coin-lock
```

It runs 1,000 concurrent transactions that lock the same coin row and only reads/rolls back trading state. The HTTP benchmark additionally performs a buy/sell round trip and verifies post-trade portfolio, circulating-supply, reserve, and transaction-count invariants. Use the output p95/p99 latency to set an operational target for the selected PostgreSQL plan; these benchmarks do not replace load testing in the final hosting environment.

For a staging-only end-to-end test, start the API and run this with a temporary database fixture. It creates 1,000 temporary users, submits one authenticated buy per user, reports HTTP latency/statuses, and cleans up the users and coin:

```sh
BENCHMARK_ALLOW_MUTATION=1 \
BENCHMARK_BASE_URL=http://127.0.0.1:3000 \
BENCHMARK_ORIGIN=http://localhost:5173 \
pnpm --dir backend run benchmark:http-trades
```

Never run the mutating benchmark against production.

All balances and trades are paper-money only. No real stock orders or real-money settlement are performed by this application.

The asset schema distinguishes virtual AMM coins from future reference-priced market assets. Reference-priced assets use the stored `reference_price` for paper execution and support 8-decimal fractional shares; a future market-data/MCP provider is responsible for updating that quote and its timestamp. No live provider is enabled by default. Reference trades are rejected when the quote is missing or older than `REFERENCE_QUOTE_MAX_AGE_SECONDS` (default 300 seconds); the public response exposes `referenceQuoteStale` for UI status.

Future provider integrations should use `backend/src/services/marketQuoteService.ts`. It verifies the reference asset, provider symbol, and data source under a row lock, then updates the quote atomically. The service is currently not scheduled or connected to an MCP provider.
Trusted provisioning code can use `backend/src/services/marketAssetService.ts` to create a reference asset such as AAPL without exposing an unauthenticated public provisioning endpoint.
