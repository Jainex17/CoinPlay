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
    created_at: Date;
}

export class TransactionsModel {
    static async createTable() {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                CREATE TABLE IF NOT EXISTS transactions (
                    tid SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(uid) ON DELETE CASCADE,
                    coin_id INTEGER REFERENCES coins(cid) ON DELETE CASCADE,
                    type VARCHAR(10) NOT NULL,
                    amount BIGINT NOT NULL,
                    price_per_token DECIMAL NOT NULL,
                    total_cost DECIMAL NOT NULL,
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

    static async getVolume24hByCoin(coin_id: number) {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT SUM(amount) as volume
                FROM transactions
                WHERE coin_id = $1
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
                SELECT price_per_token, created_at
                FROM transactions
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
                FROM transactions
                WHERE coin_id = $1
                AND created_at >= NOW() - INTERVAL '24 hours'
                ORDER BY created_at ASC
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
                INSERT INTO transactions (user_id, coin_id, type, amount, price_per_token, total_cost)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `, [transaction.user_id, transaction.coin_id, transaction.type, transaction.amount, transaction.price_per_token, transaction.total_cost]);
            return result.rows[0];
        } catch (error) {
            console.error("Error creating transaction:", error);
            throw error;
        }
    }
}
