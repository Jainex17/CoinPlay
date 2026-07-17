import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import Routes from './routes/Routes';
import { pool } from './config/db';

dotenv.config();

const app = express();
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

app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());

app.use(cors({
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
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
  if (origin !== frontendUrl) {
    return res.status(403).json({ error: 'Untrusted request origin' });
  }
  next();
};

app.use('/api', apiLimiter, requireTrustedOrigin);
app.use('/api/auth/google', authLimiter);

app.use('/api', Routes);

app.use((err: Error, _req: Request, res: Response, _next: (error?: Error) => void) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error('Unhandled request error', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
