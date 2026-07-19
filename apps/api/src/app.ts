import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { securityMiddleware, corsMiddleware, apiLimiter, authLimiter } from './middleware/security';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from '@stokku/database';
import { logger } from './utils/logger';
import { config } from './config';

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
import reportRoutes from './modules/reports/reports.routes';
import userRoutes from './modules/users/users.routes';
import roleRoutes from './modules/roles/roles.routes';
import settingsRoutes from './modules/settings/settings.routes';

let configValidated = false;
function validateConfig() {
  if (configValidated) return;
  const errors: string[] = [];
  if (!config.jwt.accessSecret || config.jwt.accessSecret.length < 16) {
    errors.push('ACCESS_TOKEN_SECRET must be at least 16 characters');
  }
  if (!config.jwt.refreshSecret || config.jwt.refreshSecret.length < 16) {
    errors.push('REFRESH_TOKEN_SECRET must be at least 16 characters');
  }
  configValidated = true;
  if (errors.length > 0) {
    logger.error('Configuration validation failed', { errors });
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

const app = express();

// Vercel terminates TLS and forwards client IP via X-Forwarded-For.
// Trust the platform proxy so express-rate-limit can identify clients
// correctly (prevents ERR_ERL_UNEXPECTED_X_FORWARDED_FOR).
app.set('trust proxy', 1);

app.use((_req: Request, _res: Response, next: NextFunction) => {
  try {
    validateConfig();
    next();
  } catch (err) {
    next(err);
  }
});

app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(requestIdMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
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
app.use('/api/v1/reports', apiLimiter, reportRoutes);
app.use('/api/v1/users', apiLimiter, userRoutes);
app.use('/api/v1/roles', apiLimiter, roleRoutes);
app.use('/api/v1/settings', apiLimiter, settingsRoutes);

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

export default app;
