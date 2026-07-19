import { PoolClient } from "pg";
import { pool } from "../config/db";

export interface Transactions {
    tid: number;
    user_id: number;
    coin_id: number;
    type: string;
    amount: number;
    price_per_token: number;
    total_cost: number;
    market_price?: number;
    idempotency_key?: string;
    created_at: Date;
}

export class TransactionsModel {
    static async createTable() {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                CREATE TABLE IF NOT EXISTS transactions (
                    tid SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
                    coin_id INTEGER NOT NULL REFERENCES coins(cid) ON DELETE CASCADE,
                    type VARCHAR(10) NOT NULL,
                    amount DECIMAL(28, 8) NOT NULL,
                    price_per_token DECIMAL NOT NULL,
                    total_cost DECIMAL NOT NULL,
                    market_price DECIMAL NOT NULL,
                    idempotency_key VARCHAR(128),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            if (result.rowCount === 0) {
                console.error("Error creating transactions table");
                throw new Error("Error creating transactions table");
            }
            console.log("Transactions table created successfully");
        } catch (error) {
            console.error("Error creating transactions table:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    static async findByIdempotencyKey(user_id: number, idempotency_key: string, client: PoolClient) {
        const result = await client.query(`
            SELECT * FROM transactions
            WHERE user_id = $1 AND idempotency_key = $2
            LIMIT 1;
        `, [user_id, idempotency_key]);
        return result.rows[0] || null;
    }

    static async getVolume24hByCoin(coin_id: number) {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT COALESCE(SUM(total_cost), 0) as volume
                FROM transactions
                WHERE coin_id = $1
                AND type IN ('buy', 'sell')
                AND created_at >= NOW() - INTERVAL '24 hours';
            `, [coin_id]);
            return result.rows[0].volume;
        } catch (error) {
            console.error("Error getting volume 24h by coin:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    static async getPriceHistoryByCoin(coin_id: number) {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT market_price AS price_per_token, created_at
                FROM transactions
                WHERE coin_id = $1
                UNION ALL
                SELECT price AS price_per_token, as_of AS created_at
                FROM market_quote_history
                WHERE coin_id = $1
                ORDER BY created_at ASC;
            `, [coin_id]);
            return result.rows;
        } catch (error) {
            console.error("Error getting price history by coin:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    static async getPrice24hAgoByCoin(coin_id: number) {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT price_per_token
                FROM (
                    SELECT market_price AS price_per_token, created_at
                    FROM transactions
                    WHERE coin_id = $1
                    UNION ALL
                    SELECT price AS price_per_token, as_of AS created_at
                    FROM market_quote_history
                    WHERE coin_id = $1
                ) history
                WHERE created_at <= NOW() - INTERVAL '24 hours'
                ORDER BY created_at DESC
                LIMIT 1;
            `, [coin_id]);
            return result.rows[0]?.price_per_token || null;
        } catch (error) {
            console.error("Error getting price 24h ago by coin:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    static async createTransaction(transaction: Omit<Transactions, "tid" | "created_at">, client: PoolClient) {
        try {
            const result = await client.query(`
                INSERT INTO transactions (user_id, coin_id, type, amount, price_per_token, total_cost, market_price, idempotency_key)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `, [transaction.user_id, transaction.coin_id, transaction.type, transaction.amount, transaction.price_per_token, transaction.total_cost, transaction.market_price ?? transaction.price_per_token, transaction.idempotency_key ?? null]);
            return result.rows[0];
        } catch (error) {
            console.error("Error creating transaction:", error);
            throw error;
        }
    }
}
