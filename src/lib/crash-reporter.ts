import * as Sentry from '@sentry/react-native';
import { logger } from './logger';
import { getConfig } from './config';

const TAG = 'CrashReporter';

export interface Breadcrumb {
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface PerformanceTransaction {
  finish(): void;
  setStatus(status: 'ok' | 'error' | 'cancelled'): void;
}

export interface CrashReporter {
  init(): void;
  captureException(error: Error, context?: Record<string, unknown>): void;
  setUser(user: { id: string; email?: string } | null): void;
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
  startTransaction(name: string, op: string): PerformanceTransaction;
  setTag(key: string, value: string): void;
  recordMetric(name: string, value: number, unit?: string): void;
}

class ConsoleCrashReporter implements CrashReporter {
  private breadcrumbs: Breadcrumb[] = [];
  private currentUser: { id: string; email?: string } | null = null;
  private readonly maxBreadcrumbs = 50;

  init(): void {
    logger.info(TAG, 'Console crash reporter initialized (dev mode)');
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    logger.error(TAG, `Exception captured: ${error.message}`, {
      name: error.name,
      stack: error.stack,
      context,
      user: this.currentUser,
      breadcrumbs: this.breadcrumbs.slice(-10),
    });
  }

  setUser(user: { id: string; email?: string } | null): void {
    this.currentUser = user;
    logger.debug(TAG, `User set: ${user?.id ?? 'null'}`);
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: Date.now(),
    });

    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  startTransaction(name: string, op: string): PerformanceTransaction {
    logger.debug(TAG, `Transaction started: ${name} (${op})`);
    return {
      finish: () => logger.debug(TAG, `Transaction finished: ${name}`),
      setStatus: (status) => logger.debug(TAG, `Transaction ${name}: ${status}`),
    };
  }

  setTag(key: string, value: string): void {
    logger.debug(TAG, `Tag set: ${key}=${value}`);
  }

  recordMetric(name: string, value: number, unit = 'ms'): void {
    logger.debug(TAG, `Metric: ${name}=${value}${unit}`);
  }
}

class SentryCrashReporter implements CrashReporter {
  private dsn: string;

  constructor(dsn: string) {
    this.dsn = dsn;
  }

  init(): void {
    if (!this.dsn) {
      logger.warn(TAG, 'Sentry DSN not configured, falling back to console reporter');
      return;
    }

    Sentry.init({
      dsn: this.dsn,
      tracesSampleRate: 0.2,
      enableAutoSessionTracking: true,
      enableAutoPerformanceTracing: true,
    });

    logger.info(TAG, 'Sentry crash reporter initialized');
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    Sentry.captureException(error, { extra: context });
  }

  setUser(user: { id: string; email?: string } | null): void {
    Sentry.setUser(user);
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    Sentry.addBreadcrumb({
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: breadcrumb.level,
      data: breadcrumb.data,
    });
  }

  startTransaction(name: string, op: string): PerformanceTransaction {
    const span = Sentry.startInactiveSpan({ name, op });
    return {
      finish: () => span?.end(),
      setStatus: (status) => {
        if (span) {
          span.setStatus(status === 'ok' ? { code: 1, message: 'ok' } : { code: 2, message: status });
        }
      },
    };
  }

  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  recordMetric(name: string, value: number, unit = 'ms'): void {
    Sentry.metrics.distribution(name, value, { unit });
  }
}

function createCrashReporter(): CrashReporter {
  const config = getConfig();
  if (config.enableCrashReporting && config.sentryDsn) {
    return new SentryCrashReporter(config.sentryDsn);
  }
  return new ConsoleCrashReporter();
}

let instance: CrashReporter = new ConsoleCrashReporter();

export function getCrashReporter(): CrashReporter {
  return instance;
}

export function initCrashReporter(): void {
  instance = createCrashReporter();
}

export function setCrashReporter(reporter: CrashReporter): void {
  instance = reporter;
}
