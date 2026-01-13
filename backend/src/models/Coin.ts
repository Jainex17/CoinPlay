import { PoolClient } from "pg";
import { pool } from "../config/db";

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
                circulating_supply BIGINT NOT NULL,
                initial_price DECIMAL(36,18) NOT NULL DEFAULT 0.001,
                price_multiplier DECIMAL(36,18) NOT NULL DEFAULT 0.00000001,
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
}