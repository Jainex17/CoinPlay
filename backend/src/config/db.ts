import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const { DATABASE_URL } = process.env;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.MODE === 'prod' ? {
    rejectUnauthorized: false,
  } : false,
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