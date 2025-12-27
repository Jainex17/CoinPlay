import { pool } from "../config/db";

export interface Bets {
  bid: number;
  user_id: number;
  bet_amount: number;
  bet_result: string;
  created_at: Date;
}

export class BetsModel {
  static async createTable() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        CREATE TABLE IF NOT EXISTS bets (
          bid SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(uid) ON DELETE CASCADE,
          bet_amount DECIMAL(20, 7) DEFAULT 0,
          bet_result VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
        );
      `);
      if (result.rowCount === 0) {
        console.error("Error creating bets table");
        throw new Error("Error creating bets table");
      }
      console.log("Bets table created successfully");

    } catch (error) {
      console.error("Error creating bets table:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async createBet(user_id: number, bet_amount: number, bet_result: string) {
    const client = await pool.connect();
    try {
      const query = 'INSERT INTO bets (user_id, bet_amount, bet_result) VALUES ($1, $2, $3) RETURNING *';
      const result = await client.query(query, [user_id, bet_amount, bet_result]);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating bet:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAllBetsByUser(user_id: number) {
    const client = await pool.connect();
    try {
      const query = 'SELECT bid, bet_amount, bet_result, created_at FROM bets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20';
      const result = await client.query(query, [user_id]);
      return result.rows;
    } catch (error) {
      console.error("Error finding bets by user:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async CoinFlipResult(uid: number, betAmount: number, result: string) {
    const client = await pool.connect();
    try {
      const newBalance = result === "win" ? betAmount : -betAmount;
      const query =
        "UPDATE users SET balance = balance + $1 WHERE uid = $2 RETURNING balance";
      const resultquery = await client.query(query, [newBalance, uid]);

      if (resultquery.rowCount === 0) {
        throw new Error("Error updating portfolio cash");
      }

      await BetsModel.createBet(uid, betAmount, result);

      return resultquery.rows[0].balance;
    } catch (error) {
      console.error("Error updating portfolio cash:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}