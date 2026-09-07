import { refreshCookieOptions, REFRESH_COOKIE_NAME } from '../auth.cookies';

describe('refreshCookieOptions', () => {
  const origEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = origEnv;
    jest.resetModules();
  });

  it('should use SameSite=Lax, HttpOnly, Secure=false in development', () => {
    process.env.NODE_ENV = 'development';
    // Re-import to pick up env, but config is evaluated at import; we test current config (dev by default)
    // In test env, NODE_ENV=test -> secure false, sameSite lax
    const opts = refreshCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.path).toBe('/api/v1/auth');
    expect(opts.sameSite).toBe('lax');
    expect(opts.secure).toBe(false);
    expect(opts.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    expect(REFRESH_COOKIE_NAME).toBe('stokku_refresh');
  });

  it('production refresh cookie must be Secure, HttpOnly, SameSite=Lax, path /api/v1/auth', () => {
    jest.isolateModules(() => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { config } = require('../../../config');
      expect(config.cookie.secure).toBe(true);
      expect(config.cookie.sameSite).toBe('lax');
      expect(config.auth.refreshSessionTtlSeconds).toBe(604800);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { refreshCookieOptions: prodOpts } = require('../auth.cookies');
      const opts = prodOpts();
      expect(opts.httpOnly).toBe(true);
      expect(opts.secure).toBe(true);
      expect(opts.sameSite).toBe('lax');
      expect(opts.path).toBe('/api/v1/auth');
    });
  });

  it('should not use SameSite=None in production', () => {
    jest.isolateModules(() => {
      process.env.NODE_ENV = 'production';
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { config } = require('../../../config');
      expect(config.cookie.sameSite).not.toBe('none');
    });
  });
});
