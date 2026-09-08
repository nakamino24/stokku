describe('refreshCookieOptions', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    jest.resetModules();
  });

  it('uses Secure, HttpOnly, SameSite=Lax in production', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { refreshCookieOptions } = require('../auth.cookies');

    const options = refreshCookieOptions();

    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe('lax');
    expect(options.path).toBe('/api/v1/auth');
    expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('does not require Secure cookies in local development', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { refreshCookieOptions } = require('../auth.cookies');

    const options = refreshCookieOptions();

    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(false);
    expect(options.sameSite).toBe('lax');
  });

  it('never uses SameSite=None', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { refreshCookieOptions } = require('../auth.cookies');

    expect(refreshCookieOptions().sameSite).not.toBe('none');
  });
});