import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// The frontend and API share a single Vercel deployment, so requests are
// same-origin in production. CORS is configured permissively to support local
// development against a separate dev origin, but no external production origin
// is required.
const devOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3002')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const securityMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

export const corsMiddleware = cors({
  origin: process.env.VERCEL ? true : devOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later', code: 'RATE_LIMITED' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later', code: 'RATE_LIMITED' },
});
