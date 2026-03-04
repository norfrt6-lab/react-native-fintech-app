import { logger } from './logger';

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
    logger.info(TAG, 'Console crash reporter initialized (web mode)');
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

const instance: CrashReporter = new ConsoleCrashReporter();

export function getCrashReporter(): CrashReporter {
  return instance;
}

export function initCrashReporter(): void {
  // No-op on web — always uses console reporter
}

export function setCrashReporter(_reporter: CrashReporter): void {
  // No-op on web
}
