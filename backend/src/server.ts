import './config/env'; // Must be first — loads and validates .env
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';

import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import itemRoutes from './routes/itemRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import settingsRoutes from './routes/settingsRoutes';

const app = express();

// Render/other reverse proxies sit in front of Express.
// Trusting proxy ensures req.ip reflects the real client IP for rate limiting.
app.set('trust proxy', 1);

const allowedOrigins = new Set([
  env.clientUrl,
  ...env.clientUrls,
  'http://localhost:8081',
  'exp://localhost:8081',
  'http://localhost:19006',
]);

const isAllowedOrigin = (origin: string): boolean => {
  const normalized = origin.trim().replace(/\/+$/, '');
  if (allowedOrigins.has(normalized)) return true;

  // Allow Vercel preview deployments for this project family.
  if (/^https:\/\/indra-s-pantry(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(normalized)) return true;

  return false;
};

const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/+$/, '');

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', normalizeOrigin(origin));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
    );
    res.header('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    if (origin && !isAllowedOrigin(origin)) {
      return res.status(403).json({ success: false, message: `CORS blocked for origin: ${origin}` });
    }
    return res.sendStatus(204);
  }

  return next();
});

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.nodeEnv === 'production' ? 1200 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root info endpoints for hosted environments
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: "Indra's Pantry API is running",
    health: '/health',
    apiBase: '/api',
  });
});

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'API base route',
    routes: [
      '/api/auth',
      '/api/categories',
      '/api/items',
      '/api/cart',
      '/api/orders',
      '/api/users',
      '/api/settings',
    ],
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(env.port, () => {
  console.log(`🚀 Indra's Pantry API running on http://localhost:${env.port}`);
  console.log(`   Environment : ${env.nodeEnv}`);
  console.log(`   Supabase    : ${env.supabaseUrl}`);
});

export default app;
