import { getCrashReporter } from './crash-reporter';
import { logger } from './logger';

const TAG = 'Metrics';

export type MetricName =
  | 'api_request_duration'
  | 'trade_execution_time'
  | 'sync_queue_size'
  | 'sync_failure_count'
  | 'app_cold_start_time'
  | 'screen_render_time'
  | 'auth_flow_duration'
  | 'market_data_staleness';

export function recordMetric(name: MetricName, value: number, unit = 'ms'): void {
  getCrashReporter().recordMetric(name, value, unit);
  logger.debug(TAG, `${name}: ${value}${unit}`);
}

export async function measureAsync<T>(
  name: MetricName,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    recordMetric(name, Date.now() - start);
    return result;
  } catch (error) {
    recordMetric(name, Date.now() - start);
    throw error;
  }
}
