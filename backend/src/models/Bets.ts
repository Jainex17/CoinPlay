import { pool } from "../config/db";

export interface Bets {
  bid: number;
  uid: number;
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
          uid INTEGER REFERENCES users(uid) ON DELETE CASCADE,
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

  static async createBet(uid: number, bet_amount: number, bet_result: string) {
    const client = await pool.connect();
    try {
      const query = 'INSERT INTO bets (uid, bet_amount, bet_result) VALUES ($1, $2, $3) RETURNING *';
      const result = await client.query(query, [uid, bet_amount, bet_result]);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating bet:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAllBetsByUser(uid: number) {
    const client = await pool.connect();
    try {
      const query = 'SELECT bid, bet_amount, bet_result, created_at FROM bets WHERE uid = $1 ORDER BY created_at DESC LIMIT 20';
      const result = await client.query(query, [uid]);
      return result.rows;
    } catch (error) {
      console.error("Error finding bets by user:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}