jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { TokenBucketRateLimiter } from '../../src/api/rate-limiter';

describe('TokenBucketRateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows requests when tokens are available', async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 5,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    await limiter.acquire();
    expect(limiter.getAvailableTokens()).toBe(4);
  });

  it('consumes all burst tokens without blocking', async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 3,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.getAvailableTokens()).toBe(0);
  });

  it('queues requests when tokens are exhausted', async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 1,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    await limiter.acquire();
    expect(limiter.getAvailableTokens()).toBe(0);

    // This should be queued
    const promise = limiter.acquire(5000);
    expect(limiter.getQueueLength()).toBe(1);

    // Advance time to trigger refill and queue processing
    jest.advanceTimersByTime(1000);
    await promise;

    expect(limiter.getQueueLength()).toBe(0);
  });

  it('refills tokens over time', () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 5,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    // Consume all tokens synchronously via getAvailableTokens trick
    // Use acquire to consume
    limiter.acquire(); // 4 left
    limiter.acquire(); // 3 left
    limiter.acquire(); // 2 left
    limiter.acquire(); // 1 left
    limiter.acquire(); // 0 left

    expect(limiter.getAvailableTokens()).toBe(0);

    // Advance 3 seconds → should refill 3 tokens
    jest.advanceTimersByTime(3000);
    expect(limiter.getAvailableTokens()).toBe(3);
  });

  it('does not exceed maxTokens on refill', () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 3,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    // Already at max (3), advance time
    jest.advanceTimersByTime(10000);
    expect(limiter.getAvailableTokens()).toBe(3);
  });

  it('rejects with timeout when queue wait exceeds limit', async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 1,
      refillRate: 1,
      refillIntervalMs: 60000, // Very slow refill
    });

    await limiter.acquire();

    const promise = limiter.acquire(500);
    jest.advanceTimersByTime(500);

    await expect(promise).rejects.toThrow('Rate limit timeout');
    expect(limiter.getQueueLength()).toBe(0);
  });

  it('processes queued requests in FIFO order', async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 1,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    await limiter.acquire();

    const order: number[] = [];
    const p1 = limiter.acquire(5000).then(() => order.push(1));
    const p2 = limiter.acquire(5000).then(() => order.push(2));

    expect(limiter.getQueueLength()).toBe(2);

    // Advance enough for 2 refills
    jest.advanceTimersByTime(1000);
    await p1;
    jest.advanceTimersByTime(1000);
    await p2;

    expect(order).toEqual([1, 2]);
  });

  it('reports queue length accurately', async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 1,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    await limiter.acquire();
    expect(limiter.getQueueLength()).toBe(0);

    limiter.acquire(5000);
    expect(limiter.getQueueLength()).toBe(1);

    limiter.acquire(5000);
    expect(limiter.getQueueLength()).toBe(2);

    // Let them drain
    jest.advanceTimersByTime(2000);
  });
});
