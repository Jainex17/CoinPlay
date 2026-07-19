import { pool } from "../config/db";
import { CoinModel } from "../models/Coin";

export interface ReferenceAssetDefinition {
  name: string;
  symbol: string;
  creatorId: number;
  externalSymbol: string;
  dataSource: string;
  totalSupply?: number;
  referencePrice?: number;
  referencePriceUpdatedAt?: Date;
}

/**
 * Provisions a reference-priced paper asset for a future provider worker.
 * This intentionally has no public route; callers must be trusted internal code.
 */
export async function provisionReferenceAsset(definition: ReferenceAssetDefinition) {
  const symbol = definition.symbol.toUpperCase();
  const totalSupply = definition.totalSupply ?? 1_000_000_000;
  if (!definition.name.trim() || definition.name.length > 100 || !/^[A-Z0-9]{3,6}$/.test(symbol)) {
    throw new Error("Invalid reference asset identity");
  }
  if (!definition.externalSymbol.trim() || definition.externalSymbol.length > 32 || !definition.dataSource.trim() || definition.dataSource.length > 64) {
    throw new Error("Reference asset provider identity is required");
  }
  if (!Number.isSafeInteger(totalSupply) || totalSupply <= 0) {
    throw new Error("Reference asset total supply must be a positive safe integer");
  }
  if (definition.referencePrice !== undefined && (!Number.isFinite(definition.referencePrice) || definition.referencePrice <= 0)) {
    throw new Error("Reference asset price must be positive");
  }
  if ((definition.referencePrice === undefined) !== (definition.referencePriceUpdatedAt === undefined)) {
    throw new Error("Reference price and timestamp must be supplied together");
  }
  if (definition.referencePriceUpdatedAt && (!Number.isFinite(definition.referencePriceUpdatedAt.getTime()) || definition.referencePriceUpdatedAt.getTime() > Date.now() + 60_000)) {
    throw new Error("Reference price timestamp is invalid");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const asset = await CoinModel.createReferenceAsset({
      name: definition.name.trim(),
      symbol,
      creator_id: definition.creatorId,
      external_symbol: definition.externalSymbol.trim(),
      data_source: definition.dataSource.trim(),
      total_supply: totalSupply,
      reference_price: definition.referencePrice,
      reference_price_updated_at: definition.referencePriceUpdatedAt,
    }, client);
    await client.query("COMMIT");
    return asset;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
