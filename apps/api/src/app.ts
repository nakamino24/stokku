import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { securityMiddleware, corsMiddleware, apiLimiter, authLimiter } from './middleware/security';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from '@stokku/database';
import { logger } from './utils/logger';
import { config } from './config';

import { authMiddleware } from './middleware/auth';
import { checkAuthorizationHandler } from './target-authorization/authorization-http-adapter';

import authRoutes from './modules/auth/auth.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import productRoutes from './modules/products/products.routes';
import categoryRoutes from './modules/categories/categories.routes';
import supplierRoutes from './modules/suppliers/suppliers.routes';
import customerRoutes from './modules/customers/customers.routes';
import warehouseRoutes from './modules/warehouses/warehouses.routes';
import stockRoutes from './modules/stock/stock.routes';
import purchaseOrderRoutes from './modules/purchase-orders/purchase-orders.routes';
import salesOrderRoutes from './modules/sales-orders/sales-orders.routes';
import putawayRoutes from './modules/putaway/putaway.routes';
import pickingRoutes from './modules/picking/picking.routes';
import packingRoutes from './modules/packing/packing.routes';
import shipmentRoutes from './modules/shipment/shipment.routes';
import cycleCountRoutes from './modules/cycle-counts/cycle-counts.routes';
import returnsRoutes from './modules/returns/returns.routes';
import reportRoutes from './modules/reports/reports.routes';
import reconciliationRoutes from './modules/reconciliation/reconciliation.routes';
import userRoutes from './modules/users/users.routes';
import roleRoutes from './modules/roles/roles.routes';
import settingsRoutes from './modules/settings/settings.routes';

let configValidated = false;
export function validateConfig() {
  if (configValidated) return;
  const errors: string[] = [];
  if (!config.jwt.accessSecret || config.jwt.accessSecret.length < 32) {
    errors.push('ACCESS_TOKEN_SECRET must be at least 32 characters');
  }
  if (config.nodeEnv === 'production') {
    if (!config.email.resendApiKey) errors.push('RESEND_API_KEY is required in production');
    if (!config.email.from) errors.push('EMAIL_FROM is required in production');
    if (!config.emailOutbox.encryptionKey || config.emailOutbox.encryptionKey.length < 32) {
      errors.push('EMAIL_OUTBOX_ENCRYPTION_KEY must be at least 32 characters in production');
    }
    if (!process.env.APP_URL || !config.appUrl.startsWith('https://')) {
      errors.push('APP_URL must be an HTTPS URL in production');
    }
    if (!process.env.CORS_ORIGINS || config.cors.origins.some(origin => !origin.startsWith('https://'))) {
      errors.push('CORS_ORIGINS must contain HTTPS origins in production');
    }
  }
  if (errors.length > 0) {
    logger.error('Configuration validation failed', { errors });
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
  configValidated = true;
}

const app = express();

// Vercel terminates TLS and forwards client IP via X-Forwarded-For.
// Trust the platform proxy so express-rate-limit can identify clients correctly.
app.set('trust proxy', 1);

app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(requestIdMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

app.use((req: Request, _res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;
  logger.info(`${req.method} ${req.path}`, { requestId, ip: req.ip });
  next();
});

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
    });
  } catch {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/v1/products', apiLimiter, productRoutes);
app.use('/api/v1/categories', apiLimiter, categoryRoutes);
app.use('/api/v1/suppliers', apiLimiter, supplierRoutes);
app.use('/api/v1/customers', apiLimiter, customerRoutes);
app.use('/api/v1/warehouses', apiLimiter, warehouseRoutes);
app.use('/api/v1/stock', apiLimiter, stockRoutes);
app.use('/api/v1/purchase-orders', apiLimiter, purchaseOrderRoutes);
app.use('/api/v1/sales-orders', apiLimiter, salesOrderRoutes);
app.use('/api/v1/putaway', apiLimiter, putawayRoutes);
app.use('/api/v1/picking', apiLimiter, pickingRoutes);
app.use('/api/v1/packing', apiLimiter, packingRoutes);
app.use('/api/v1/shipment', apiLimiter, shipmentRoutes);
app.use('/api/v1/cycle-counts', apiLimiter, cycleCountRoutes);
app.use('/api/v1/returns', apiLimiter, returnsRoutes);
app.use('/api/v1/reconciliation', apiLimiter, reconciliationRoutes);
app.use('/api/v1/reports', apiLimiter, reportRoutes);
app.use('/api/v1/users', apiLimiter, userRoutes);
app.use('/api/v1/roles', apiLimiter, roleRoutes);
app.use('/api/v1/settings', apiLimiter, settingsRoutes);

if (config.features.enableTargetAuthorizationAdapter) {
  app.post('/api/v1/_parity/authorization/check', apiLimiter, authMiddleware, checkAuthorizationHandler);
  logger.info('Target authorization adapter enabled: POST /api/v1/_parity/authorization/check');
} else {
  logger.info('Target authorization adapter disabled (ENABLE_TARGET_AUTHORIZATION_ADAPTER=false)');
}

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Not Found',
      requestId: _req.headers['x-request-id'],
    },
  });
});

app.use(errorHandler);

export default app;
