import { Request } from 'express';
import { AppError } from './errors';

export function requireIdempotencyKey(req: Request): string {
  const value = req.get('idempotency-key');
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    throw AppError.badRequest('A valid Idempotency-Key header is required');
  }
  return value;
}
