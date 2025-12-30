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

    static async createCoin(coin: Omit<Coin, 'cid' | 'total_supply' | 'initial_price' | 'price_multiplier' | 'created_at' | 'updated_at'>) {
        const capitalSymbol = coin.symbol.toUpperCase();

        const query = `
            INSERT INTO coins (name, symbol, creator_id, circulating_supply)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await pool.query(query, [
            coin.name,
            capitalSymbol,
            coin.creator_id,
            coin.circulating_supply,
        ]);
        return result.rows[0];
    }

    static async updateCirculatingSupply(cid: number, amount: number, client: PoolClient) {
        const query = 'UPDATE coins SET circulating_supply = circulating_supply + $1 WHERE cid = $2 RETURNING *';
        const result = await client.query(query, [amount, cid]);
        return result.rows[0];
    }
}