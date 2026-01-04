import { PoolClient } from "pg";
import { pool } from "../config/db";
import { BetsModel } from "./Bets";
import { UserModel } from "./User";

export interface Portfolio {
  pid: number;
  user_id: number;
  coin_id: number;
  amount: number;
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, coin_id)
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
         LIMIT 10`,
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
         LIMIT 10`,
      );

      const MostCashPlayerData = MostCashPlayerQuery.rows;
      const MostCashWageredData = MostCashWageredQuery.rows;

      return {
        MostCashPlayerData,
        MostCashWageredData,
      };
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByUsername(
    username: string,
  ): Promise<
    | (Portfolio & {
        name: string;
        picture: string;
        username: string;
        created_at: Date;
      })
    | null
  > {
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
        created_at: row.user_created_at,
      };
    } catch (error) {
      console.error("Error finding portfolio by username:", error);
      throw error;
    }
  }

  static async getHoldersByCoinId(
    coin_id: number,
  ): Promise<{ holders: UserModel }[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          u.username,
          u.name,
          u.picture,
          p.amount,
          COALESCE(SUM(CASE WHEN t.type = 'buy' THEN t.total_cost ELSE 0 END), 0) as total_spent
        FROM portfolios p
        JOIN users u ON p.user_id = u.uid
        LEFT JOIN transactions t ON t.user_id = p.user_id AND t.coin_id = p.coin_id
        WHERE p.coin_id = $1 AND p.amount > 0
        GROUP BY u.username, u.name, u.picture, p.amount
        ORDER BY p.amount DESC;`,
        [coin_id],
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting holders by coin id:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async buyCoin(
    portfolio: Omit<Portfolio, "pid" | "created_at" | "updated_at">,
    client: PoolClient,
  ) {
    try {
      const bigIntAmount = BigInt(portfolio.amount);
      const result = await client.query(
        `INSERT INTO portfolios (user_id, coin_id, amount)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, coin_id) DO UPDATE
         SET amount = portfolios.amount + $3
         RETURNING *;`,
        [portfolio.user_id, portfolio.coin_id, bigIntAmount],
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error buying coin:", error);
      throw error;
    }
  }

  static async sellCoin(
    portfolio: Omit<Portfolio, "pid" | "created_at" | "updated_at">,
    client: PoolClient,
  ) {
    try {
      const bigIntAmount = BigInt(Math.floor(portfolio.amount));
      const result = await client.query(
        `UPDATE portfolios
         SET amount = amount - $3
         WHERE user_id = $1 AND coin_id = $2 AND amount >= $3
         RETURNING *;`,
        [portfolio.user_id, portfolio.coin_id, bigIntAmount],
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error selling coin:", error);
      throw error;
    }
  }

  static async getPortfolioForUpdate(
    user_id: number,
    coin_id: number,
    client: PoolClient,
  ): Promise<Portfolio | null> {
    try {
      const result = await client.query(
        `SELECT * FROM portfolios WHERE user_id = $1 AND coin_id = $2 FOR UPDATE`,
        [user_id, coin_id],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting portfolio for update:", error);
      throw error;
    }
  }

  static async getUserCoinHoldings(user_id: number) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          p.amount,
          c.cid,
          c.name,
          c.symbol,
          c.token_reserve,
          c.base_reserve,
          COALESCE(SUM(CASE WHEN t.type = 'buy' THEN t.total_cost ELSE 0 END), 0) as total_spent,
          CASE
            WHEN c.token_reserve > 0 THEN (c.base_reserve::DECIMAL / c.token_reserve::DECIMAL)
            ELSE 0
          END as current_price
        FROM portfolios p
        JOIN coins c ON p.coin_id = c.cid
        LEFT JOIN transactions t ON t.user_id = p.user_id AND t.coin_id = p.coin_id AND t.type = 'buy'
        WHERE p.user_id = $1 AND p.amount > 0
        GROUP BY p.amount, c.cid, c.name, c.symbol, c.token_reserve, c.base_reserve
        ORDER BY p.amount DESC;`,
        [user_id],
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting user coin holdings:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}
