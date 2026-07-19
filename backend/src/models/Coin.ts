import { PoolClient } from "pg";
import { pool } from "../config/db";
import { MarketQuote } from "../lib/marketData";

export interface Coin {
    cid: number;
    name: string;
    symbol: string;
    creator_id: number;
    total_supply: number;
    circulating_supply: number;
    initial_price: number;
    price_multiplier: number;
    token_reserve: number;
    base_reserve: number;
    asset_type: "virtual_coin" | "market_asset";
    pricing_model: "constant_product" | "reference";
    external_symbol?: string;
    data_source?: string;
    reference_price?: number;
    reference_price_updated_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export class CoinModel {
    static async createTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS coins (
                cid SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                symbol VARCHAR(255) UNIQUE NOT NULL,
                creator_id INT NOT NULL,
                total_supply BIGINT NOT NULL DEFAULT 1000000000,
                circulating_supply DECIMAL(28,8) NOT NULL,
                initial_price DECIMAL(36,18) NOT NULL DEFAULT 0.001,
                price_multiplier DECIMAL(36,18) NOT NULL DEFAULT 0.00000001,
                token_reserve BIGINT NOT NULL DEFAULT 1000000000,
                base_reserve DECIMAL(36,18) NOT NULL DEFAULT 1000,
                asset_type VARCHAR(20) NOT NULL DEFAULT 'virtual_coin',
                pricing_model VARCHAR(24) NOT NULL DEFAULT 'constant_product',
                external_symbol VARCHAR(32),
                data_source VARCHAR(64),
                reference_price DECIMAL(36,18),
                reference_price_updated_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (creator_id) REFERENCES users(uid)
            );
            
            CREATE INDEX IF NOT EXISTS idx_coins_symbol ON coins(symbol);
            CREATE INDEX IF NOT EXISTS idx_coins_creator_id ON coins(creator_id);
        `;

        try {
            await pool.query(query);
            console.log('Coins table created successfully');
        } catch (error) {
            console.error('Error creating coins table:', error);
            throw error;
        }
    }

    static async getAllCoins() {
        const query = 'SELECT * FROM coins';
        const result = await pool.query(query);
        return result.rows;
    }

    static async getCoinBySymbol(symbol: string) {
        const capitalSymbol = symbol.toUpperCase();
        const query = 'SELECT * FROM coins WHERE symbol = $1';
        const result = await pool.query(query, [capitalSymbol]);
        return result.rows[0];
    }

    static async getCoinBySymbolForUpdate(symbol: string, client: PoolClient) {
        const capitalSymbol = symbol.toUpperCase();
        const query = 'SELECT * FROM coins WHERE symbol = $1 FOR UPDATE';
        const result = await client.query(query, [capitalSymbol]);
        return result.rows[0];
    }

    static async symbolExists(symbol: string): Promise<boolean> {
        const capitalSymbol = symbol.toUpperCase();
        const query = 'SELECT 1 FROM coins WHERE symbol = $1 LIMIT 1';
        const result = await pool.query(query, [capitalSymbol]);
        return result.rows.length > 0;
    }

    static async createCoin(coin: { name: string; symbol: string; creator_id: number; token_reserve: number; base_reserve: number }, client?: PoolClient) {
        const capitalSymbol = coin.symbol.toUpperCase();
        const db = client || pool;

        const query = `
            INSERT INTO coins (name, symbol, creator_id, circulating_supply, token_reserve, base_reserve)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const result = await db.query(query, [
            coin.name,
            capitalSymbol,
            coin.creator_id,
            0,
            coin.token_reserve,
            coin.base_reserve,
        ]);
        return result.rows[0];
    }

    static async createReferenceAsset(asset: {
        name: string;
        symbol: string;
        creator_id: number;
        external_symbol: string;
        data_source: string;
        total_supply: number;
        reference_price?: number;
        reference_price_updated_at?: Date;
    }, client: PoolClient) {
        const result = await client.query(`
            INSERT INTO coins (
                name, symbol, creator_id, total_supply, circulating_supply,
                token_reserve, base_reserve, asset_type, pricing_model,
                external_symbol, data_source, reference_price, reference_price_updated_at
            )
            VALUES ($1, $2, $3, $4, 0, 1, 1, 'market_asset', 'reference', $5, $6, $7, $8)
            RETURNING *;
        `, [
            asset.name,
            asset.symbol.toUpperCase(),
            asset.creator_id,
            asset.total_supply,
            asset.external_symbol,
            asset.data_source,
            asset.reference_price ?? null,
            asset.reference_price_updated_at ?? null,
        ]);
        const created = result.rows[0];

        if (created && asset.reference_price && asset.reference_price_updated_at) {
            await client.query(`
                INSERT INTO market_quote_history (coin_id, instrument_symbol, source, price, as_of)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (coin_id, source, as_of) DO NOTHING;
            `, [created.cid, asset.external_symbol, asset.data_source, asset.reference_price, asset.reference_price_updated_at]);
        }
        return created;
    }

    static async updateCirculatingSupply(cid: number, amount: number, client: PoolClient) {
        const query = 'UPDATE coins SET circulating_supply = circulating_supply + $1 WHERE cid = $2 RETURNING *';
        const result = await client.query(query, [amount, cid]);
        return result.rows[0];
    }

    static async decreaseCirculatingSupply(cid: number, amount: number, client: PoolClient) {
        const query = 'UPDATE coins SET circulating_supply = circulating_supply - $1 WHERE cid = $2 AND circulating_supply >= $1 RETURNING *';
        const result = await client.query(query, [amount, cid]);
        return result.rows[0];
    }

    static async buyFromPool(cid: number, tokensOut: number, baseIn: number, client: PoolClient) {
        const query = `
            UPDATE coins
            SET token_reserve = token_reserve - $1,
                base_reserve = base_reserve + $2,
                circulating_supply = circulating_supply + $1
            WHERE cid = $3 AND token_reserve >= $1
            RETURNING *;
        `;
        const result = await client.query(query, [tokensOut, baseIn, cid]);
        return result.rows[0];
    }

    static async sellToPool(cid: number, tokensIn: number, baseOut: number, client: PoolClient) {
        const query = `
            UPDATE coins
            SET token_reserve = token_reserve + $1,
                base_reserve = base_reserve - $2,
                circulating_supply = circulating_supply - $1
            WHERE cid = $3 AND base_reserve >= $2
            RETURNING *;
        `;
        const result = await client.query(query, [tokensIn, baseOut, cid]);
        return result.rows[0];
    }

    static async updateReferenceQuote(coinId: number, quote: MarketQuote, client: PoolClient) {
        const asOfMs = quote.asOf instanceof Date ? quote.asOf.getTime() : NaN;
        if (!Number.isFinite(quote.price) || quote.price <= 0 || !Number.isFinite(asOfMs) || asOfMs > Date.now() + 60_000 || typeof quote.currency !== "string" || quote.currency.toUpperCase() !== "USD" || !quote.instrumentSymbol || !quote.source) {
            throw new Error("Invalid market quote");
        }

        const result = await client.query(`
            UPDATE coins
            SET reference_price = $1,
                reference_price_updated_at = $2,
                data_source = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE cid = $4
              AND pricing_model = 'reference'
              AND external_symbol = $5
              AND (reference_price_updated_at IS NULL OR reference_price_updated_at <= $2)
            RETURNING *;
        `, [quote.price, quote.asOf, quote.source, coinId, quote.instrumentSymbol]);
        const updated = result.rows[0];
        if (!updated) return null;

        await client.query(`
            INSERT INTO market_quote_history (coin_id, instrument_symbol, source, price, as_of)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (coin_id, source, as_of) DO UPDATE
            SET price = EXCLUDED.price,
                instrument_symbol = EXCLUDED.instrument_symbol;
        `, [coinId, quote.instrumentSymbol, quote.source, quote.price, quote.asOf]);
        return updated;
    }
}
