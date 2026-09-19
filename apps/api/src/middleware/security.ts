import { AppError } from '../utils/errors'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { config } from '../config'

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...config.cors.origins],
    },
  },
  crossOriginEmbedderPolicy: false,
})

export const corsMiddleware = cors({
  origin(origin, callback) {
    const allowed = (config as any).cors?.origins as string[] | undefined
    // Requests without an Origin header (same-origin navigation, health checks,
    // CLI clients) do not need a CORS allow decision.
    if (!origin || !allowed || allowed.includes(origin)) {
      callback(null, true)
      return
    }
    callback(AppError.forbidden('Origin not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'Idempotency-Key',
    'X-CSRF-Token',
  ],
  maxAge: 86400,
})

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (config as any).rateLimit?.api ?? 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (config as any).rateLimit?.auth ?? 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, please try again later' } },
})

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: (config as any).rateLimit?.passwordReset ?? 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many password reset requests, please try again later' } },
})
