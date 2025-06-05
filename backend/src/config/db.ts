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

// Handle pool errors and reconnection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('New client connected to the database');
});

pool.on('remove', () => {
  console.log('Client removed from the database pool');
});

let isConnected = false;

const connectDB = async () => {
    try {
        const client = await pool.connect();
        client.release(); // Release the test connection back to pool
        console.log('Connected to the database');
        isConnected = true;
        return true;
    } catch (error) {
        console.error('Error connecting to the database', error);
        isConnected = false;
        return false;
    }
}

const checkConnection = async () => {
    try {
        const client = await pool.connect();
        client.release();
        isConnected = true;
        return true;
    } catch (error) {
        console.error('Database connection lost, attempting to reconnect...', error);
        isConnected = false;
        return await connectDB();
    }
}

export { connectDB, pool, checkConnection, isConnected };