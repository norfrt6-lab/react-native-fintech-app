jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockReporter = {
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  startTransaction: jest.fn(),
  setTag: jest.fn(),
  recordMetric: jest.fn(),
};

jest.mock('../../src/lib/crash-reporter', () => ({
  getCrashReporter: () => mockReporter,
}));

import { recordMetric, measureAsync } from '../../src/lib/metrics';

describe('Metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordMetric', () => {
    it('delegates to crash reporter', () => {
      recordMetric('api_request_duration', 150);
      expect(mockReporter.recordMetric).toHaveBeenCalledWith('api_request_duration', 150, 'ms');
    });

    it('passes custom unit', () => {
      recordMetric('sync_queue_size', 5, 'count');
      expect(mockReporter.recordMetric).toHaveBeenCalledWith('sync_queue_size', 5, 'count');
    });
  });

  describe('measureAsync', () => {
    it('records duration for successful async operations', async () => {
      const result = await measureAsync('trade_execution_time', async () => {
        return 'success';
      });

      expect(result).toBe('success');
      expect(mockReporter.recordMetric).toHaveBeenCalledWith(
        'trade_execution_time',
        expect.any(Number),
        'ms',
      );
    });

    it('records duration and re-throws on failure', async () => {
      const error = new Error('trade failed');

      await expect(
        measureAsync('trade_execution_time', async () => {
          throw error;
        }),
      ).rejects.toThrow('trade failed');

      expect(mockReporter.recordMetric).toHaveBeenCalledWith(
        'trade_execution_time',
        expect.any(Number),
        'ms',
      );
    });

    it('records non-negative duration', async () => {
      await measureAsync('auth_flow_duration', async () => 'done');

      const [, value] = mockReporter.recordMetric.mock.calls[0];
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });
});
