import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const { DATABASE_URL } = process.env;

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.MODE === 'prod' ? {
    rejectUnauthorized: false,
  } : false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

const connectDB = async () => {
    try {
        await pool.connect();
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database', error);
    }
}

export { connectDB, pool };