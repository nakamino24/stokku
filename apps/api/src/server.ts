import app, { validateConfig } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { EmailOutboxService } from './modules/auth/email-outbox.service';

const port = config.port;
const host = '0.0.0.0';

validateConfig();

const server = app.listen(port, host, () => {
  logger.info(`API listening on http://${host}:${port}`, {
    port,
    host,
    nodeEnv: config.nodeEnv,
  });
});

const emailOutboxInterval = setInterval(() => {
  void EmailOutboxService.processBatch().catch((error) => {
    logger.error('Email outbox worker failed', {
      error: error instanceof Error ? error.message : 'Unknown worker error',
    });
  });
}, config.emailOutbox.intervalMs);

function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  clearInterval(emailOutboxInterval);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  // Force close after 10s
  setTimeout(() => {
    logger.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
