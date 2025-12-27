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

class TransactionsModel {
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
}
