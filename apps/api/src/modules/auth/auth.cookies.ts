import { CookieOptions, Response } from 'express';
import { config } from '../../config';

export const REFRESH_COOKIE_NAME = 'stokku_refresh';

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: config.auth.refreshSessionTtlSeconds * 1000,
  };
}

export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  const options = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  });
}
