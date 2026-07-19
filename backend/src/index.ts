import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { createHash, randomUUID } from 'node:crypto';
import Routes from './routes/Routes';
import { pool } from './config/db';
import { requiredMigrations } from './migration/manifest';

dotenv.config();

const app = express();
app.disable('x-powered-by');
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
if (isProduction && (!process.env.FRONTEND_URL || !process.env.JWT_SECRET || !process.env.DATABASE_URL)) {
  throw new Error('FRONTEND_URL, JWT_SECRET, and DATABASE_URL must be configured in production');
}

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use((req, res, next) => {
  const supplied = req.get('x-request-id');
  const requestId = supplied && /^[A-Za-z0-9._:-]{1,128}$/.test(supplied) ? supplied : randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());

app.use(cors({
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Idempotency-Key'],
  exposedHeaders: ['Set-Cookie']
}));

const rateLimitKey = (req: Request) => {
  const sessionToken = req.cookies?.token;
  if (sessionToken) {
    return `session:${createHash('sha256').update(sessionToken).digest('hex')}`;
  }
  return `ip:${ipKeyGenerator(req.ip || 'unknown')}`;
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  keyGenerator: rateLimitKey,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

// Cookie-authenticated state changes must originate from the configured web app.
// This prevents another site from spending a logged-in user's balance via their cookie.
const requireTrustedOrigin = (req: Request, res: Response, next: () => void) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('origin');
  const fetchSite = req.get('sec-fetch-site');
  if ((origin && origin !== frontendUrl) || fetchSite === 'cross-site') {
    return res.status(403).json({ error: 'Untrusted request origin' });
  }
  next();
};

app.use('/api', apiLimiter, requireTrustedOrigin);
app.use('/api/auth/google', authLimiter);

app.use('/api', Routes);

app.use((err: Error, _req: Request, res: Response, _next: (error?: Error) => void) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body', requestId: res.locals.requestId });
  }
  console.error('Unhandled request error', { requestId: res.locals.requestId, error: err });
  res.status(500).json({ error: 'Internal server error', requestId: res.locals.requestId });
});

let server: ReturnType<typeof app.listen> | null = null;

const validateDatabaseSchema = async () => {
  const requiredColumns = [
    ['users', 'balance'],
    ['coins', 'token_reserve'],
    ['coins', 'base_reserve'],
    ['coins', 'pricing_model'],
    ['coins', 'external_symbol'],
    ['coins', 'reference_price_updated_at'],
    ['market_quote_history', 'coin_id'],
    ['transactions', 'market_price'],
    ['transactions', 'idempotency_key'],
  ];
  const result = await pool.query(`
    WITH required(table_name, column_name) AS (
      SELECT * FROM unnest($1::text[], $2::text[])
    )
    SELECT COUNT(*) FILTER (WHERE columns.column_name IS NULL)::int AS missing
    FROM required
    LEFT JOIN information_schema.columns
      ON columns.table_name = required.table_name
     AND columns.column_name = required.column_name
     AND columns.table_schema = 'public';
  `, [requiredColumns.map(([table]) => table), requiredColumns.map(([, column]) => column)]);
  const missing = Number(result.rows[0]?.missing || 0);
  if (missing > 0) {
    throw new Error(`Database schema is missing ${missing} required column(s); apply migrations before starting`);
  }

  if (isProduction) {
    const migrationTable = await pool.query("SELECT to_regclass('public.schema_migrations') AS table_name");
    if (!migrationTable.rows[0]?.table_name) {
      throw new Error('schema_migrations is missing; run the migration runner before starting production');
    }
    const applied = await pool.query(
      'SELECT COUNT(*)::int AS count FROM schema_migrations WHERE version = ANY($1::text[])',
      [requiredMigrations],
    );
    if (Number(applied.rows[0]?.count || 0) !== requiredMigrations.length) {
      throw new Error('Database migrations are incomplete; run the migration runner before starting production');
    }
  }
};

const start = async () => {
  await validateDatabaseSchema();
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  server.requestTimeout = 60_000;
  server.headersTimeout = 65_000;
  server.keepAliveTimeout = 5_000;
};

let shuttingDown = false;
const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; draining HTTP and database connections`);

  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  if (!server) {
    void pool.end().finally(() => process.exit());
    return;
  }

  server.close(async (error) => {
    if (error) {
      console.error('HTTP shutdown error:', error);
      process.exitCode = 1;
    }
    await pool.end();
    clearTimeout(forceExit);
    process.exit();
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

void start().catch((error: unknown) => {
  console.error('Server startup failed:', error);
  void pool.end().finally(() => process.exit(1));
});
