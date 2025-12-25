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
                    uid INTEGER REFERENCES users(uid) ON DELETE CASCADE,
                    cash DECIMAL(20, 7) DEFAULT 0,
                    claimed_cash DECIMAL(20, 7) DEFAULT 0,
                    last_claim_date TIMESTAMP,
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

  static async findOrCreate(uid: number): Promise<Portfolio> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM portfolios WHERE uid = $1`,
        [uid]
      );
      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        const insertQuery = `INSERT INTO portfolios (uid, last_claim_date) VALUES ($1, CURRENT_TIMESTAMP - INTERVAL '24 hours') RETURNING *`;
        const insertResult = await client.query(insertQuery, [uid]);
        return insertResult.rows[0];
      }
    } catch (error) {
      console.error("Error finding or creating portfolio:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(uid: number): Promise<Portfolio | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM portfolios WHERE uid = $1`,
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

  static async updateClaim(uid: number, cash: number, CURRENT_TIMESTAMP: Date) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE portfolios SET cash = cash + $1, claimed_cash = claimed_cash + $1, last_claim_date = $2 WHERE uid = $3 RETURNING *`,
        [cash, CURRENT_TIMESTAMP, uid]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating claim:", error);
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
        "UPDATE portfolios SET cash = cash + $1 WHERE uid = $2 RETURNING cash";
      const resultquery = await client.query(query, [newBalance, uid]);

      if (resultquery.rowCount === 0) {
        throw new Error("Error updating portfolio cash");
      }

      await BetsModel.createBet(uid, betAmount, result);

      return resultquery.rows[0].cash;
    } catch (error) {
      console.error("Error updating portfolio cash:", error);
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
         p.cash
         FROM portfolios p 
         JOIN users u ON p.uid = u.uid 
         ORDER BY p.cash DESC 
         LIMIT 10`
      );

      const MostCashWageredQuery = await client.query(
        `SELECT 
         u.name, 
         u.picture, 
         COUNT(b.bid) as total_bets,
         SUM(b.bet_amount) as total_wagered
         FROM users u 
         JOIN bets b ON u.uid = b.uid 
         GROUP BY u.uid, u.name, u.picture 
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
        JOIN users u ON p.uid = u.uid 
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