jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('Config', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns development config when __DEV__ is true', () => {
    (globalThis as unknown as Record<string, unknown>).__DEV__ = true;
    const { getConfig } = require('../../src/lib/config');

    const config = getConfig();
    expect(config.env).toBe('development');
    expect(config.logLevel).toBe('debug');
    expect(config.enableCrashReporting).toBe(false);
    expect(config.enableAnalytics).toBe(false);
  });

  it('returns production config when APP_ENV is production and __DEV__ is false', () => {
    (globalThis as unknown as Record<string, unknown>).__DEV__ = false;
    process.env.APP_ENV = 'production';
    const { getConfig } = require('../../src/lib/config');

    const config = getConfig();
    expect(config.env).toBe('production');
    expect(config.logLevel).toBe('warn');
    expect(config.enableCrashReporting).toBe(true);
    expect(config.enableAnalytics).toBe(true);
  });

  it('returns preview config when APP_ENV is preview', () => {
    (globalThis as unknown as Record<string, unknown>).__DEV__ = false;
    process.env.APP_ENV = 'preview';
    const { getConfig } = require('../../src/lib/config');

    const config = getConfig();
    expect(config.env).toBe('preview');
    expect(config.logLevel).toBe('info');
    expect(config.enableCrashReporting).toBe(true);
    expect(config.enableAnalytics).toBe(false);
  });

  it('isDev returns true in development', () => {
    (globalThis as unknown as Record<string, unknown>).__DEV__ = true;
    const { isDev } = require('../../src/lib/config');
    expect(isDev()).toBe(true);
  });

  it('isProd returns true in production', () => {
    (globalThis as unknown as Record<string, unknown>).__DEV__ = false;
    process.env.APP_ENV = 'production';
    const { isProd } = require('../../src/lib/config');
    expect(isProd()).toBe(true);
  });

  it('config includes sentryDsn field', () => {
    (globalThis as unknown as Record<string, unknown>).__DEV__ = true;
    const { getConfig } = require('../../src/lib/config');
    const config = getConfig();
    expect(config).toHaveProperty('sentryDsn');
  });

  afterEach(() => {
    (globalThis as unknown as Record<string, unknown>).__DEV__ = true;
    delete process.env.APP_ENV;
  });
});
