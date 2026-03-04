import { getCrashReporter } from './crash-reporter';
import { getConfig } from './config';
import { logger } from './logger';

const TAG = 'Analytics';

export type AnalyticsEvent =
  | { name: 'screen_view'; properties: { screen: string } }
  | { name: 'trade_executed'; properties: { side: string; symbol: string; amount: number } }
  | { name: 'trade_failed'; properties: { side: string; symbol: string; error: string } }
  | { name: 'watchlist_add'; properties: { coinId: string } }
  | { name: 'watchlist_remove'; properties: { coinId: string } }
  | { name: 'price_alert_created'; properties: { coinId: string; targetPrice: number; condition: string } }
  | { name: 'app_foregrounded'; properties?: Record<string, unknown> }
  | { name: 'app_backgrounded'; properties?: Record<string, unknown> }
  | { name: 'session_start'; properties?: Record<string, unknown> }
  | { name: 'session_end'; properties: { durationMs: number } };

class AnalyticsService {
  private enabled = false;
  private sessionStartTime = 0;

  init(): void {
    const config = getConfig();
    this.enabled = config.enableAnalytics;

    if (!this.enabled) {
      logger.debug(TAG, 'Analytics disabled');
      return;
    }

    this.sessionStartTime = Date.now();
    logger.info(TAG, 'Analytics initialized');

    this.track({ name: 'session_start' });
  }

  track(event: AnalyticsEvent): void {
    if (!this.enabled) return;

    getCrashReporter().addBreadcrumb({
      category: 'analytics',
      message: event.name,
      level: 'info',
      data: event.properties,
    });

    logger.debug(TAG, `Event: ${event.name}`, event.properties);
  }

  trackScreenView(screen: string): void {
    this.track({ name: 'screen_view', properties: { screen } });
  }

  endSession(): void {
    if (!this.enabled || !this.sessionStartTime) return;

    this.track({
      name: 'session_end',
      properties: { durationMs: Date.now() - this.sessionStartTime },
    });
    this.sessionStartTime = 0;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

let instance: AnalyticsService | null = null;

export function getAnalytics(): AnalyticsService {
  if (!instance) {
    instance = new AnalyticsService();
  }
  return instance;
}

export function initAnalytics(): void {
  getAnalytics().init();
}
