import { pool } from '../config/db';

export interface User {
  uid?: number;
  google_id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        uid SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        picture TEXT,
        given_name VARCHAR(255),
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

  static async findOrCreate(userData: Omit<User, 'uid' | 'created_at' | 'updated_at'>): Promise<User> {
    const client = await pool.connect();
    
    try {
      const findQuery = 'SELECT * FROM users WHERE google_id = $1 OR email = $2';
      const findResult = await client.query(findQuery, [userData.google_id, userData.email]);
      
      if (findResult.rows.length > 0) {
        return findResult.rows[0];
      } else {
        const insertQuery = `
          INSERT INTO users (google_id, email, name, picture, given_name)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const insertResult = await client.query(insertQuery, [
          userData.google_id,
          userData.email,
          userData.name,
          userData.picture,
          userData.given_name,
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
} 