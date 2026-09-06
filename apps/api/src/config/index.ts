if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  require('dotenv').config();
}

const isVercel = Boolean(process.env.VERCEL);
const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl,

  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET || '',
    accessExpiresIn: 900,
  },

  auth: {
    refreshSessionTtlSeconds: 7 * 24 * 60 * 60,
    refreshReuseGraceSeconds: 10,
    passwordResetTtlMinutes: 60,
  },

  cors: {
    origins: isVercel
      ? [process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : appUrl].filter(Boolean)
      : (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3002')
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
  },

  rateLimit: {
    api: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    auth: 20,
    passwordReset: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || '5', 10),
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
