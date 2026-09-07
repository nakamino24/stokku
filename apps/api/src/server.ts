import { prisma } from '@stokku/database';
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info('API server started', { port: config.port });
});

async function shutdown(signal: string): Promise<void> {
  logger.info('API server shutting down', { signal });

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
