import { syncQueue } from '../../src/core/sync/sync-queue';

jest.mock('../../src/lib/storage', () => ({
  zustandStorage: {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('SyncQueue', () => {
  beforeEach(() => {
    syncQueue.clear();
  });

  it('starts with zero pending', () => {
    expect(syncQueue.getPendingCount()).toBe(0);
  });

  it('enqueues actions', () => {
    syncQueue.enqueue({ type: 'trade', payload: { amount: 100 } });
    expect(syncQueue.getPendingCount()).toBe(1);

    syncQueue.enqueue({ type: 'settings', payload: { theme: 'dark' } });
    expect(syncQueue.getPendingCount()).toBe(2);
  });

  it('processes queue successfully', async () => {
    syncQueue.enqueue({ type: 'trade', payload: { amount: 100 } });
    syncQueue.enqueue({ type: 'watchlist', payload: { coinId: 'btc' } });

    const result = await syncQueue.processQueue(async () => true);
    expect(result.processed).toBe(2);
    expect(result.failed).toBe(0);
    expect(syncQueue.getPendingCount()).toBe(0);
  });

  it('retries failed actions', async () => {
    syncQueue.enqueue({ type: 'trade', payload: { amount: 100 } });

    // First attempt: fail
    await syncQueue.processQueue(async () => false);
    expect(syncQueue.getPendingCount()).toBe(1);

    // Second attempt: fail
    await syncQueue.processQueue(async () => false);
    expect(syncQueue.getPendingCount()).toBe(1);

    // Third attempt: fail - should be removed
    await syncQueue.processQueue(async () => false);
    expect(syncQueue.getPendingCount()).toBe(0);
  });

  it('handles mixed success/failure', async () => {
    syncQueue.enqueue({ type: 'trade', payload: { amount: 100 } });
    syncQueue.enqueue({ type: 'settings', payload: { theme: 'dark' } });

    let callCount = 0;
    const result = await syncQueue.processQueue(async () => {
      callCount++;
      return callCount === 1; // First succeeds, second fails
    });

    expect(result.processed).toBe(1);
    expect(syncQueue.getPendingCount()).toBe(1);
  });

  it('clears all actions', () => {
    syncQueue.enqueue({ type: 'trade', payload: {} });
    syncQueue.enqueue({ type: 'settings', payload: {} });
    syncQueue.clear();
    expect(syncQueue.getPendingCount()).toBe(0);
  });

  it('does not process when already processing', async () => {
    syncQueue.enqueue({ type: 'trade', payload: {} });

    let resolveFirst: () => void;
    const firstPromise = new Promise<void>((r) => { resolveFirst = r; });

    const processing = syncQueue.processQueue(async () => {
      await firstPromise;
      return true;
    });

    // Try to process again while first is still running
    const secondResult = await syncQueue.processQueue(async () => true);
    expect(secondResult.processed).toBe(0);

    resolveFirst!();
    await processing;
  });
});
