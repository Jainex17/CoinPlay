import { performance } from "node:perf_hooks";
import { pool } from "../config/db.js";

const symbol = process.env.BENCHMARK_COIN_SYMBOL?.toUpperCase();
const requests = Number(process.env.BENCHMARK_REQUESTS || 1_000);
const holdMs = Number(process.env.BENCHMARK_HOLD_MS || 1);

if (!symbol) {
  throw new Error("BENCHMARK_COIN_SYMBOL is required");
}
if (!Number.isSafeInteger(requests) || requests < 1 || requests > 10_000) {
  throw new Error("BENCHMARK_REQUESTS must be an integer between 1 and 10,000");
}
if (!Number.isFinite(holdMs) || holdMs < 0 || holdMs > 1_000) {
  throw new Error("BENCHMARK_HOLD_MS must be between 0 and 1,000");
}

async function main() {
  const durations: number[] = [];
  const startedAt = performance.now();

  await Promise.all(Array.from({ length: requests }, async () => {
  const client = await pool.connect();
  const requestStartedAt = performance.now();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT cid FROM coins WHERE symbol = $1 FOR UPDATE",
      [symbol],
    );
    if (result.rowCount !== 1) {
      throw new Error(`Coin ${symbol} was not found`);
    }
    await client.query("SELECT pg_sleep($1)", [holdMs / 1_000]);
    await client.query("COMMIT");
    durations.push(performance.now() - requestStartedAt);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
  }));

  durations.sort((a, b) => a - b);
  const elapsedMs = performance.now() - startedAt;
  const percentile = (value: number) => durations[Math.min(durations.length - 1, Math.floor(durations.length * value))];

  console.log(JSON.stringify({
    symbol,
    requests,
    poolMax: process.env.DB_POOL_MAX || 50,
    holdMs,
    elapsedMs: Math.round(elapsedMs),
    throughputPerSecond: Math.round((requests / elapsedMs) * 1_000 * 100) / 100,
    p50Ms: Math.round(percentile(0.50)),
    p95Ms: Math.round(percentile(0.95)),
    p99Ms: Math.round(percentile(0.99)),
  }, null, 2));

  await pool.end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
