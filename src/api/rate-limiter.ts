import { RATE_LIMIT } from '../lib/constants';
import { logger } from '../lib/logger';

const TAG = 'RateLimiter';

interface RateLimiterConfig {
  maxTokens: number;
  refillRate: number;
  refillIntervalMs: number;
}

interface QueuedRequest {
  resolve: () => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private queue: QueuedRequest[] = [];
  private readonly config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.tokens = config.maxTokens;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd =
      Math.floor(elapsed / this.config.refillIntervalMs) * this.config.refillRate;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.config.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  private processQueue(): void {
    while (this.queue.length > 0 && this.tokens > 0) {
      this.tokens--;
      const next = this.queue.shift()!;
      clearTimeout(next.timeoutId);
      next.resolve();
    }

    // If queue still has items, schedule another check
    if (this.queue.length > 0) {
      setTimeout(() => {
        this.refill();
        this.processQueue();
      }, this.config.refillIntervalMs);
    }
  }

  async acquire(timeoutMs: number = RATE_LIMIT.ACQUIRE_TIMEOUT_MS): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.queue.findIndex((item) => item.resolve === resolve);
        if (index >= 0) this.queue.splice(index, 1);
        reject(new Error('Rate limit timeout'));
      }, timeoutMs);

      this.queue.push({ resolve, reject, timeoutId });
      logger.debug(TAG, `Request queued (queue size: ${this.queue.length})`);

      // Schedule a check when a token should be available
      setTimeout(() => {
        this.refill();
        this.processQueue();
      }, this.config.refillIntervalMs);
    });
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export const apiRateLimiter = new TokenBucketRateLimiter({
  maxTokens: RATE_LIMIT.MAX_TOKENS,
  refillRate: RATE_LIMIT.REFILL_RATE,
  refillIntervalMs: RATE_LIMIT.REFILL_INTERVAL_MS,
});
