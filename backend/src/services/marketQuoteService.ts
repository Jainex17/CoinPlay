import { PoolClient } from "pg";
import { CoinModel } from "../models/Coin";
import { pool } from "../config/db";
import { MarketDataProvider } from "../lib/marketData";

/**
 * Refresh one reference-priced asset through an injected provider.
 * No provider is constructed or called by the application today; a future
 * MCP adapter can call this service after its own scheduling and auth checks.
 */
export async function refreshReferenceQuote(coinId: number, provider: MarketDataProvider, existingClient?: PoolClient) {
  const client = existingClient ?? await pool.connect();
  const ownsTransaction = !existingClient;

  try {
    if (ownsTransaction) await client.query("BEGIN");

    const result = await client.query(
      `SELECT pricing_model, external_symbol, data_source
       FROM coins
       WHERE cid = $1
       FOR UPDATE`,
      [coinId],
    );
    const coin = result.rows[0];
    if (!coin || coin.pricing_model !== "reference" || !coin.external_symbol) {
      if (ownsTransaction) await client.query("ROLLBACK");
      return null;
    }

    const quote = await provider.getQuote(coin.external_symbol);
    if (!quote || quote.instrumentSymbol !== coin.external_symbol || (coin.data_source && quote.source !== coin.data_source)) {
      if (ownsTransaction) await client.query("ROLLBACK");
      return null;
    }

    const updated = await CoinModel.updateReferenceQuote(coinId, quote, client);
    if (!updated) {
      if (ownsTransaction) await client.query("ROLLBACK");
      return null;
    }

    if (ownsTransaction) await client.query("COMMIT");
    return updated;
  } catch (error) {
    if (ownsTransaction) await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    if (ownsTransaction) client.release();
  }
}
