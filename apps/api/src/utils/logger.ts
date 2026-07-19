export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toUpperCase() as keyof typeof LogLevel;
const CURRENT_LEVEL = LogLevel[LOG_LEVEL] ?? LogLevel.INFO;

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(level: string, levelValue: LogLevel, message: string, meta?: unknown): void {
  if (levelValue < CURRENT_LEVEL) return;

  const entry = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...(meta !== undefined ? { meta: typeof meta === 'object' ? meta : { value: meta } } : {}),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case 'ERROR':
      process.stderr.write(output + '\n');
      break;
    case 'WARN':
      process.stderr.write(output + '\n');
      break;
    default:
      process.stdout.write(output + '\n');
  }
}

export const logger = {
  debug: (message: string, meta?: unknown) => log('DEBUG', LogLevel.DEBUG, message, meta),
  info: (message: string, meta?: unknown) => log('INFO', LogLevel.INFO, message, meta),
  warn: (message: string, meta?: unknown) => log('WARN', LogLevel.WARN, message, meta),
  error: (message: string, meta?: unknown) => log('ERROR', LogLevel.ERROR, message, meta),
};
