import dotenv from 'dotenv';
import { Pool, types } from 'pg';

// Set type parsers for BIGINT (int8) and NUMERIC/DECIMAL
types.setTypeParser(20, (val: string) => parseInt(val, 10)); // BIGINT
types.setTypeParser(1700, (val: string) => parseFloat(val)); // NUMERIC/DECIMAL

dotenv.config();

const { DATABASE_URL } = process.env;
const parsedPoolMax = Number(process.env.DB_POOL_MAX || 50);
const poolMax = Number.isInteger(parsedPoolMax) && parsedPoolMax >= 1 && parsedPoolMax <= 100
  ? parsedPoolMax
  : 50;
const parsedConnectionTimeout = Number(process.env.DB_CONNECTION_TIMEOUT_MS || 30_000);
const connectionTimeoutMillis = Number.isInteger(parsedConnectionTimeout) && parsedConnectionTimeout >= 1_000 && parsedConnectionTimeout <= 120_000
  ? parsedConnectionTimeout
  : 30_000;

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis,
  ssl: process.env.NODE_ENV === 'production' ? {
    // Production database connections must validate the server certificate.
    // Set DATABASE_CA_CERT when the provider uses a private CA.
    rejectUnauthorized: true,
    ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n') } : {}),
  } : false,
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

export { pool };
