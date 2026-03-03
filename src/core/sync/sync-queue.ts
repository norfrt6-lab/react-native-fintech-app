import { zustandStorage } from '../../lib/storage';
import { logger } from '../../lib/logger';

export interface SyncAction {
  id: string;
  type: 'trade' | 'settings' | 'watchlist';
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

const QUEUE_KEY = 'fintrack_sync_queue';
const MAX_RETRIES = 3;

class SyncQueue {
  private queue: SyncAction[] = [];
  private processing = false;
  private loaded = false;

  private ensureLoaded() {
    if (this.loaded) return;
    try {
      const stored = zustandStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored as string);
      }
      this.loaded = true;
    } catch {
      this.queue = [];
    }
  }

  private persist() {
    try {
      zustandStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('SyncQueue', 'Failed to persist queue', error);
    }
  }

  enqueue(action: Omit<SyncAction, 'id' | 'createdAt' | 'retryCount'>) {
    this.ensureLoaded();
    const syncAction: SyncAction = {
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
      retryCount: 0,
    };

    this.queue.push(syncAction);
    this.persist();
    logger.info('SyncQueue', `Enqueued action: ${action.type}`);
  }

  async processQueue(
    processor: (action: SyncAction) => Promise<boolean>,
  ): Promise<{ processed: number; failed: number }> {
    this.ensureLoaded();
    if (this.processing || this.queue.length === 0) {
      return { processed: 0, failed: 0 };
    }

    this.processing = true;
    let processed = 0;
    let failed = 0;

    const toProcess = [...this.queue];

    for (const action of toProcess) {
      try {
        const success = await processor(action);

        if (success) {
          this.queue = this.queue.filter((a) => a.id !== action.id);
          processed++;
        } else {
          action.retryCount++;
          if (action.retryCount >= MAX_RETRIES) {
            this.queue = this.queue.filter((a) => a.id !== action.id);
            failed++;
            logger.warn('SyncQueue', `Action ${action.id} exceeded max retries, removed`);
          }
        }
      } catch (error) {
        action.retryCount++;
        if (action.retryCount >= MAX_RETRIES) {
          this.queue = this.queue.filter((a) => a.id !== action.id);
          failed++;
        }
        logger.error('SyncQueue', `Failed to process action ${action.id}`, error);
      }
    }

    this.persist();
    this.processing = false;

    logger.info('SyncQueue', `Processed: ${processed}, Failed: ${failed}, Remaining: ${this.queue.length}`);
    return { processed, failed };
  }

  getPendingCount(): number {
    this.ensureLoaded();
    return this.queue.length;
  }

  clear() {
    this.queue = [];
    this.persist();
  }
}

export const syncQueue = new SyncQueue();
