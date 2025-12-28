import { pool } from "../config/db";

export interface Coin {
    cid: number;
    name: string;
    symbol: string;
    creator_id: number;
    total_supply: number;
    circulating_supply: number;
    initial_price: number;
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
                initial_price DECIMAL NOT NULL DEFAULT 0.000001,
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

    static async createCoin(coin: Omit<Coin, 'cid' | 'total_supply' | 'initial_price' | 'created_at' | 'updated_at'>) {
        const query = `
            INSERT INTO coins (name, symbol, creator_id, circulating_supply)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await pool.query(query, [
            coin.name,
            coin.symbol,
            coin.creator_id,
            coin.circulating_supply,
        ]);
        return result.rows[0];
    }
}