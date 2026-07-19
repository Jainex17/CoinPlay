import { performance } from "node:perf_hooks";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const baseUrl = process.env.BENCHMARK_BASE_URL || "http://127.0.0.1:3000";
const origin = process.env.BENCHMARK_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173";
const users = Number(process.env.BENCHMARK_USERS || 1_000);
const allowMutation = process.env.BENCHMARK_ALLOW_MUTATION === "1";
const secret = process.env.JWT_SECRET;
const pricingModel = process.env.BENCHMARK_PRICING_MODEL || "constant_product";
const referencePrice = Number(process.env.BENCHMARK_REFERENCE_PRICE || 200);
const referenceBuyAmount = Number(process.env.BENCHMARK_REFERENCE_BUY_AMOUNT || referencePrice);

if (!allowMutation) throw new Error("Set BENCHMARK_ALLOW_MUTATION=1 to run the mutating benchmark");
if (!secret) throw new Error("JWT_SECRET is required");
const jwtSecret = secret;
if (!Number.isSafeInteger(users) || users < 1 || users > 2_000) {
  throw new Error("BENCHMARK_USERS must be an integer between 1 and 2,000");
}
if (!['constant_product', 'reference'].includes(pricingModel)) {
  throw new Error("BENCHMARK_PRICING_MODEL must be constant_product or reference");
}
if (pricingModel === "reference" && (!Number.isFinite(referencePrice) || referencePrice <= 0)) {
  throw new Error("BENCHMARK_REFERENCE_PRICE must be positive for reference assets");
}
if (pricingModel === "reference" && (!Number.isFinite(referenceBuyAmount) || referenceBuyAmount < 0.01)) {
  throw new Error("BENCHMARK_REFERENCE_BUY_AMOUNT must be at least $0.01 for reference assets");
}

const suffix = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
const symbol = `L${Date.now().toString(36).slice(-5).toUpperCase()}`;
let userIds: number[] = [];
let coinId: number | null = null;

const percentile = (values: number[], fraction: number) =>
  values[Math.min(values.length - 1, Math.floor(values.length * fraction))];

async function cleanup() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (coinId !== null) await client.query("DELETE FROM coins WHERE cid = $1", [coinId]);
    if (userIds.length > 0) await client.query("DELETE FROM users WHERE uid = ANY($1::int[])", [userIds]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (google_id, username, email, name, balance)
       SELECT 'benchmark-google-' || $1 || '-' || n,
              'benchmark_' || $1 || '_' || n,
              'benchmark-' || $1 || '-' || n || '@invalid.test',
              'Benchmark User ' || n,
              $3::numeric
       FROM generate_series(1, $2::int) AS n
       RETURNING uid`,
      [suffix, users, pricingModel === "reference" ? referenceBuyAmount : 1.00],
    );
    userIds = userResult.rows.map((row) => Number(row.uid));

    const coinResult = await client.query(
      `INSERT INTO coins (name, symbol, creator_id, circulating_supply, token_reserve, base_reserve, asset_type, pricing_model, reference_price, reference_price_updated_at)
       VALUES ($1, $2, $3, 0, 1000000000, 1000, $4, $5::text, $6, CASE WHEN $5::text = 'reference' THEN CURRENT_TIMESTAMP ELSE NULL END)
       RETURNING cid`,
      ["HTTP Benchmark Asset", symbol, userIds[0], pricingModel === "reference" ? "market_asset" : "virtual_coin", pricingModel, pricingModel === "reference" ? referencePrice : null],
    );
    coinId = Number(coinResult.rows[0].cid);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  const runPhase = async (side: "buy" | "sell", amounts: number[]) => {
    const durations: number[] = [];
    const statusCounts = new Map<number, number>();
    const startedAt = performance.now();
    const results = await Promise.all(userIds.map(async (uid, index) => {
      const requestStartedAt = performance.now();
      const response = await fetch(`${baseUrl}/api/coin/${side}/${symbol}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": origin,
          "Cookie": `token=${jwt.sign({ uid }, jwtSecret, { expiresIn: "5m" })}`,
          "Idempotency-Key": `benchmark-${suffix}-${side}-${uid}`,
        },
        body: JSON.stringify({ amount: amounts[index] }),
      });
      const body = await response.json().catch(() => ({}));
      durations.push(performance.now() - requestStartedAt);
      statusCounts.set(response.status, (statusCounts.get(response.status) || 0) + 1);
      return { ok: response.ok, tokensReceived: Number(body.tokensReceived || 0) };
    }));
    durations.sort((a, b) => a - b);
    const elapsedMs = performance.now() - startedAt;
    const successCount = results.filter((result) => result.ok).length;
    return {
      side,
      successCount,
      statusCounts: Object.fromEntries(statusCounts),
      elapsedMs: Math.round(elapsedMs),
      throughputPerSecond: Math.round((users / elapsedMs) * 1_000 * 100) / 100,
      p50Ms: Math.round(percentile(durations, 0.50)),
      p95Ms: Math.round(percentile(durations, 0.95)),
      p99Ms: Math.round(percentile(durations, 0.99)),
      results,
    };
  };

  const buyPhase = await runPhase("buy", userIds.map(() => pricingModel === "reference" ? referenceBuyAmount : 1.00));
  if (buyPhase.successCount !== users || buyPhase.results.some((result) => result.tokensReceived <= 0)) {
    throw new Error(`Buy phase failed: ${buyPhase.successCount}/${users} succeeded`);
  }

  const marketResponse = await fetch(`${baseUrl}/api/coin/${symbol}`);
  const marketBody = await marketResponse.json();
  if (!marketResponse.ok || !marketBody.coin || Number(marketBody.coin.circulating_supply) <= 0) {
    throw new Error("Public market response did not expose the post-buy circulating supply");
  }

  const sellPhase = await runPhase("sell", buyPhase.results.map((result) => result.tokensReceived));
  if (sellPhase.successCount !== users) {
    throw new Error(`Sell phase failed: ${sellPhase.successCount}/${users} succeeded`);
  }

  const invariantResult = await pool.query(`
    SELECT
      COALESCE((SELECT SUM(amount) FROM portfolios WHERE coin_id = $1 AND user_id = ANY($2::int[])), 0) AS portfolio_total,
      c.circulating_supply,
      c.token_reserve,
      c.base_reserve,
      (SELECT COUNT(*) FROM transactions WHERE coin_id = $1 AND user_id = ANY($2::int[]) AND type IN ('buy', 'sell')) AS trade_count
    FROM coins c
    WHERE c.cid = $1;
  `, [coinId, userIds]);
  const invariants = invariantResult.rows[0];
  if (!invariants
      || Number(invariants.portfolio_total) !== 0
      || Number(invariants.circulating_supply) !== 0
      || Number(invariants.token_reserve) <= 0
      || Number(invariants.base_reserve) <= 0
      || Number(invariants.trade_count) !== users * 2) {
    throw new Error(`Post-trade database invariants failed: ${JSON.stringify(invariants)}`);
  }

  const { results: buyResults, ...buyMetrics } = buyPhase;
  const { results: _sellResults, ...sellMetrics } = sellPhase;
  void buyResults;
  void _sellResults;
  console.log(JSON.stringify({ symbol, users, pricingModel, buy: buyMetrics, sell: sellMetrics, invariants: {
    portfolioTotal: Number(invariants.portfolio_total),
    circulatingSupply: Number(invariants.circulating_supply),
    tokenReserve: Number(invariants.token_reserve),
    baseReserve: Number(invariants.base_reserve),
    tradeCount: Number(invariants.trade_count),
  } }, null, 2));
}

main()
  .finally(async () => {
    await cleanup().catch((error) => console.error("Benchmark cleanup failed:", error));
    await pool.end();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
