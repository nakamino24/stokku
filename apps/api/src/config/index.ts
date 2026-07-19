import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET || '',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || '',
    accessExpiresIn: 900,
    refreshExpiresIn: 604800,
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },

  rateLimit: {
    api: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    auth: 20,
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
