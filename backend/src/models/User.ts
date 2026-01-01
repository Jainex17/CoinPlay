import { PoolClient } from 'pg';
import { pool } from '../config/db';

export interface User {
  uid: number;
  google_id: string;
  username: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  balance: number;
  claimed_cash: number;
  last_claim_date: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        uid SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        picture TEXT,
        given_name VARCHAR(255),
        balance BIGINT NOT NULL DEFAULT 0,
        claimed_cash DECIMAL(20, 7) DEFAULT 0,
        last_claim_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP - INTERVAL '25 hours',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `;

    try {
      await pool.query(query);
      console.log('Users table created successfully');
    } catch (error) {
      console.error('Error creating users table:', error);
      throw error;
    }
  }

  static async findOrCreate(userData: Omit<User, 'uid' | 'username' | 'balance' | 'claimed_cash' | 'last_claim_date' | 'created_at' | 'updated_at'>): Promise<User> {
    const client = await pool.connect();

    try {
      const findQuery = 'SELECT * FROM users WHERE google_id = $1 OR email = $2';
      const findResult = await client.query(findQuery, [userData.google_id, userData.email]);

      if (findResult.rows.length > 0) {
        return findResult.rows[0];
      } else {
        const email_base = userData.email.split('@')[0];
        const username = email_base.replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);


        const insertQuery = `
          INSERT INTO users (google_id, email, name, picture, given_name, username)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const insertResult = await client.query(insertQuery, [
          userData.google_id,
          userData.email,
          userData.name,
          userData.picture,
          userData.given_name,
          username,
        ]);

        return insertResult.rows[0];
      }
    } catch (error) {
      console.error('Error in findOrCreate:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(uid: number): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE uid = $1';
      const result = await pool.query(query, [uid]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async findByIdForUpdate(uid: number, client: PoolClient): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE uid = $1 FOR UPDATE';
      const result = await client.query(query, [uid]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID for update:', error);
      throw error;
    }
  }

  static async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE google_id = $1';
      const result = await pool.query(query, [googleId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw error;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findByUsername(username: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await pool.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }


  static async updateClaim(uid: number, cash: number, CURRENT_TIMESTAMP: Date) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE users SET balance = balance + $1, claimed_cash = claimed_cash + $1, last_claim_date = $2 WHERE uid = $3 RETURNING *`,
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
  static async updateBalance(uid: number, amountCut: number, client: PoolClient) {
    try {
      const result = await client.query(
        `UPDATE users SET balance = balance - $1 WHERE uid = $2 AND balance >= $1 RETURNING *`,
        [amountCut, uid]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating balance:", error);
      throw error;
    }
  }

  static async addBalance(uid: number, amount: number, client: PoolClient) {
    try {
      const result = await client.query(
        `UPDATE users SET balance = balance + $1 WHERE uid = $2 RETURNING *`,
        [amount, uid]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error adding balance:", error);
      throw error;
    }
  }
} 