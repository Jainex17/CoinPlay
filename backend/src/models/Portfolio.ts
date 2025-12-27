import { pool } from "../config/db";
import { BetsModel } from "./Bets";

export interface Portfolio {
  pid: number;
  uid: number;
  cash: number;
  claimed_cash: number;
  last_claim_date: Date;
  created_at: Date;
  updated_at: Date;
}

export class PortfolioModel {
  static async createTable() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
                CREATE TABLE IF NOT EXISTS portfolios (
                    pid SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(uid) ON DELETE CASCADE,
                    coin_id INTEGER REFERENCES coins(cid) ON DELETE CASCADE,
                    amount BIGINT DEFAULT 0,
                    cash DECIMAL(20, 7) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
      if (result.rowCount === 0) {
        console.error("Error creating portfolio table");
        throw new Error("Error creating portfolio table");
      }

      console.log("Portfolio table created successfully");
    } catch (error) {
      console.error("Error creating portfolio table:", error);
      throw error;
    } finally {
      client.release();
    }
  }



  static async findById(uid: number): Promise<Portfolio | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM portfolios WHERE user_id = $1`,
        [uid]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding portfolio by id:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getLeaderboard() {
    const client = await pool.connect();
    try {
      const MostCashPlayerQuery = await client.query(
        `SELECT
         u.name,
         u.picture,
         u.username,
         u.balance
         FROM users u
         ORDER BY u.balance DESC
         LIMIT 10`
      );

      const MostCashWageredQuery = await client.query(
        `SELECT
         u.name,
         u.picture,
         u.username,
         COUNT(b.bid) as total_bets,
         SUM(b.bet_amount) as total_wagered
         FROM users u
         JOIN bets b ON u.uid = b.user_id
         GROUP BY u.uid, u.name, u.picture, u.username
         ORDER BY total_wagered DESC
         LIMIT 10`
      );

      const MostCashPlayerData = MostCashPlayerQuery.rows;
      const MostCashWageredData = MostCashWageredQuery.rows;

      return {
        MostCashPlayerData,
        MostCashWageredData
      };
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByUsername(username: string): Promise<(Portfolio & { name: string; picture: string; username: string; created_at: Date }) | null> {
    try {
      const query = `
        SELECT 
          p.*, 
          u.name, 
          u.picture, 
          u.username,
          u.created_at as user_created_at
        FROM portfolios p 
        JOIN users u ON p.user_id = u.uid 
        WHERE u.username = $1
      `;
      const result = await pool.query(query, [username]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...row,
        created_at: row.user_created_at
      };
    } catch (error) {
      console.error('Error finding portfolio by username:', error);
      throw error;
    }
  }
}