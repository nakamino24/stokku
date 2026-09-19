import { config as loadEnvironment } from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  loadEnvironment();
}

const appUrl = process.env.APP_URL || 'http://localhost:3000';

function parseCorsOrigins(): string[] {
  return (
    process.env.CORS_ORIGINS ||
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl,

  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || '',
  },

  emailOutbox: {
    intervalMs: parseInt(process.env.EMAIL_OUTBOX_INTERVAL_MS || '5000', 10),
    encryptionKey: process.env.EMAIL_OUTBOX_ENCRYPTION_KEY || '',
  },

  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET || '',
    accessExpiresIn: 900,
  },

  auth: {
    refreshSessionTtlSeconds: 7 * 24 * 60 * 60,
    refreshReuseGraceSeconds: 10,
    passwordResetTtlMinutes: 60,
    emailVerificationTtlMinutes: 24 * 60,
  },

  cors: {
    origins: parseCorsOrigins(),
  },

  rateLimit: {
    api: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    auth: 20,
    passwordReset: parseInt(
      process.env.PASSWORD_RESET_RATE_LIMIT_MAX || '5',
      10,
    ),
  },

  logLevel: process.env.LOG_LEVEL || 'info',

  features: {
    enableTargetAuthorizationAdapter: process.env.ENABLE_TARGET_AUTHORIZATION_ADAPTER === 'true',
  },
};

export function validateConfig(): void {
  const required = [
    { key: 'ACCESS_TOKEN_SECRET', value: config.jwt.accessSecret },
    { key: 'EMAIL_OUTBOX_ENCRYPTION_KEY', value: config.emailOutbox.encryptionKey },
  ];

  for (const { key, value } of required) {
    if (!value || value.length < 32) {
      throw new Error(`${key} must be set and at least 32 characters`);
    }
  }

  if (config.nodeEnv === 'production' && config.features.enableTargetAuthorizationAdapter) {
    console.warn('[WARN] ENABLE_TARGET_AUTHORIZATION_ADAPTER is enabled in production environment');
  }
}
