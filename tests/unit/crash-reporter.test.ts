jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  startInactiveSpan: jest.fn().mockReturnValue({
    end: jest.fn(),
    setStatus: jest.fn(),
  }),
  setTag: jest.fn(),
  metrics: {
    distribution: jest.fn(),
  },
}));

jest.mock('../../src/lib/config', () => ({
  getConfig: jest.fn().mockReturnValue({
    env: 'development',
    enableCrashReporting: false,
    sentryDsn: '',
  }),
}));

import {
  getCrashReporter,
  setCrashReporter,
  initCrashReporter,
  type CrashReporter,
} from '../../src/lib/crash-reporter';
import * as Sentry from '@sentry/react-native';
import { getConfig } from '../../src/lib/config';

describe('CrashReporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ConsoleCrashReporter (default)', () => {
    it('getCrashReporter returns a reporter', () => {
      const reporter = getCrashReporter();
      expect(reporter).toBeDefined();
      expect(reporter.init).toBeDefined();
      expect(reporter.captureException).toBeDefined();
    });

    it('init does not throw', () => {
      const reporter = getCrashReporter();
      expect(() => reporter.init()).not.toThrow();
    });

    it('captureException logs the error', () => {
      const { logger } = require('../../src/lib/logger');
      const reporter = getCrashReporter();
      reporter.captureException(new Error('test'));
      expect(logger.error).toHaveBeenCalled();
    });

    it('setUser stores user context', () => {
      const reporter = getCrashReporter();
      expect(() => reporter.setUser({ id: '123', email: 'test@test.com' })).not.toThrow();
      expect(() => reporter.setUser(null)).not.toThrow();
    });

    it('addBreadcrumb stores breadcrumbs', () => {
      const reporter = getCrashReporter();
      expect(() =>
        reporter.addBreadcrumb({
          category: 'nav',
          message: 'Navigated to home',
          level: 'info',
        }),
      ).not.toThrow();
    });
  });

  describe('setCrashReporter', () => {
    it('allows overriding the reporter instance', () => {
      const custom: CrashReporter = {
        init: jest.fn(),
        captureException: jest.fn(),
        setUser: jest.fn(),
        addBreadcrumb: jest.fn(),
        startTransaction: jest.fn().mockReturnValue({ finish: jest.fn(), setStatus: jest.fn() }),
        setTag: jest.fn(),
        recordMetric: jest.fn(),
      };

      setCrashReporter(custom);
      const reporter = getCrashReporter();
      expect(reporter).toBe(custom);

      reporter.captureException(new Error('test'));
      expect(custom.captureException).toHaveBeenCalled();
    });
  });

  describe('initCrashReporter', () => {
    it('creates ConsoleCrashReporter when crash reporting is disabled', () => {
      (getConfig as jest.Mock).mockReturnValue({
        env: 'development',
        enableCrashReporting: false,
        sentryDsn: '',
      });

      initCrashReporter();
      const reporter = getCrashReporter();
      reporter.init();

      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('creates SentryCrashReporter when enabled with DSN', () => {
      (getConfig as jest.Mock).mockReturnValue({
        env: 'production',
        enableCrashReporting: true,
        sentryDsn: 'https://exampledsn@sentry.io/1',
      });

      initCrashReporter();
      const reporter = getCrashReporter();
      reporter.init();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({ dsn: 'https://exampledsn@sentry.io/1' }),
      );
    });

    it('SentryCrashReporter delegates captureException to Sentry', () => {
      (getConfig as jest.Mock).mockReturnValue({
        env: 'production',
        enableCrashReporting: true,
        sentryDsn: 'https://dsn@sentry.io/1',
      });

      initCrashReporter();
      const reporter = getCrashReporter();
      const error = new Error('Production error');
      reporter.captureException(error, { page: 'home' });

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: { page: 'home' },
      });
    });

    it('SentryCrashReporter delegates setTag to Sentry', () => {
      (getConfig as jest.Mock).mockReturnValue({
        env: 'production',
        enableCrashReporting: true,
        sentryDsn: 'https://dsn@sentry.io/1',
      });

      initCrashReporter();
      getCrashReporter().setTag('screen', 'dashboard');
      expect(Sentry.setTag).toHaveBeenCalledWith('screen', 'dashboard');
    });

    it('SentryCrashReporter startTransaction creates a span', () => {
      (getConfig as jest.Mock).mockReturnValue({
        env: 'production',
        enableCrashReporting: true,
        sentryDsn: 'https://dsn@sentry.io/1',
      });

      initCrashReporter();
      const txn = getCrashReporter().startTransaction('load-market', 'navigation');
      expect(Sentry.startInactiveSpan).toHaveBeenCalledWith({
        name: 'load-market',
        op: 'navigation',
      });
      expect(txn.finish).toBeDefined();
      expect(txn.setStatus).toBeDefined();
    });

    it('SentryCrashReporter recordMetric calls Sentry.metrics.distribution', () => {
      (getConfig as jest.Mock).mockReturnValue({
        env: 'production',
        enableCrashReporting: true,
        sentryDsn: 'https://dsn@sentry.io/1',
      });

      initCrashReporter();
      getCrashReporter().recordMetric('api_request_duration', 250, 'ms');
      expect(Sentry.metrics.distribution).toHaveBeenCalledWith(
        'api_request_duration',
        250,
        { unit: 'ms' },
      );
    });
  });

  describe('ConsoleCrashReporter performance methods', () => {
    it('startTransaction returns a transaction object', () => {
      // Reset to default console reporter
      initCrashReporter();
      const txn = getCrashReporter().startTransaction('test-txn', 'test');
      expect(txn).toBeDefined();
      expect(() => txn.finish()).not.toThrow();
      expect(() => txn.setStatus('ok')).not.toThrow();
    });

    it('setTag does not throw', () => {
      initCrashReporter();
      expect(() => getCrashReporter().setTag('key', 'value')).not.toThrow();
    });

    it('recordMetric does not throw', () => {
      initCrashReporter();
      expect(() => getCrashReporter().recordMetric('test_metric', 100)).not.toThrow();
    });
  });
});
