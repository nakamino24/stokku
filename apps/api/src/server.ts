import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { securityMiddleware, corsMiddleware, apiLimiter, authLimiter } from './middleware/security';
import { requestIdMiddleware } from './middleware/requestId';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import dashboardRoutes from './routes/dashboard';
import categoryRoutes from './routes/categories';
import productRoutes from './routes/products';
import supplierRoutes from './routes/suppliers';
import warehouseRoutes from './routes/warehouses';
import stockRoutes from './routes/stock';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from '@stokku/database';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(requestIdMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;
  logger.info(`${req.method} ${req.path}`, {
    requestId,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    logger.info(`${req.method} ${req.path} ${res.statusCode}`, { requestId, statusCode: res.statusCode });
    return originalJson(body);
  };

  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/auth', authLimiter, authRoutes);

app.use(apiLimiter);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/inventory/categories', categoryRoutes);
app.use('/inventory/products', productRoutes);
app.use('/inventory/suppliers', supplierRoutes);
app.use('/inventory/warehouses', warehouseRoutes);
app.use('/inventory/stock', stockRoutes);

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down...');
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

export default app;
