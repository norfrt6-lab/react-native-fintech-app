import { zustandStorage } from '../../lib/storage';
import { logger } from '../../lib/logger';

export interface SyncAction {
  id: string;
  type: 'trade' | 'settings' | 'watchlist';
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

export interface DeadLetterAction extends SyncAction {
  failedAt: number;
  lastError: string;
}

const QUEUE_KEY = 'fintrack_sync_queue';
const DEAD_LETTER_KEY = 'fintrack_sync_dead_letter';
const MAX_RETRIES = 3;

class SyncQueue {
  private queue: SyncAction[] = [];
  private deadLetter: DeadLetterAction[] = [];
  private processing = false;
  private loaded = false;

  private ensureLoaded() {
    if (this.loaded) return;
    try {
      const stored = zustandStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored as string);
      }
      const deadStored = zustandStorage.getItem(DEAD_LETTER_KEY);
      if (deadStored) {
        this.deadLetter = JSON.parse(deadStored as string);
      }
      this.loaded = true;
    } catch {
      this.queue = [];
      this.deadLetter = [];
    }
  }

  private persist() {
    try {
      zustandStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      zustandStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(this.deadLetter));
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
            this.moveToDeadLetter(action, 'Max retries exceeded');
            failed++;
          }
        }
      } catch (error) {
        action.retryCount++;
        if (action.retryCount >= MAX_RETRIES) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          this.moveToDeadLetter(action, errorMsg);
          failed++;
        }
        logger.error('SyncQueue', `Failed to process action ${action.id}`, error);
      }
    }

    this.persist();
    this.processing = false;

    logger.info('SyncQueue', `Processed: ${processed}, Failed: ${failed}, Remaining: ${this.queue.length}, Dead letter: ${this.deadLetter.length}`);
    return { processed, failed };
  }

  private moveToDeadLetter(action: SyncAction, error: string) {
    this.queue = this.queue.filter((a) => a.id !== action.id);
    this.deadLetter.push({
      ...action,
      failedAt: Date.now(),
      lastError: error,
    });
    logger.warn('SyncQueue', `Action ${action.id} moved to dead letter queue: ${error}`);
  }

  getPendingCount(): number {
    this.ensureLoaded();
    return this.queue.length;
  }

  getFailedActions(): DeadLetterAction[] {
    this.ensureLoaded();
    return [...this.deadLetter];
  }

  getFailedCount(): number {
    this.ensureLoaded();
    return this.deadLetter.length;
  }

  async retryFailed(
    processor: (action: SyncAction) => Promise<boolean>,
  ): Promise<{ recovered: number; stillFailed: number }> {
    this.ensureLoaded();
    let recovered = 0;
    let stillFailed = 0;

    const toRetry = [...this.deadLetter];
    this.deadLetter = [];

    for (const action of toRetry) {
      try {
        const retryAction: SyncAction = {
          id: action.id,
          type: action.type,
          payload: action.payload,
          createdAt: action.createdAt,
          retryCount: 0,
        };
        const success = await processor(retryAction);
        if (success) {
          recovered++;
        } else {
          this.deadLetter.push({
            ...action,
            failedAt: Date.now(),
            lastError: 'Retry failed',
          });
          stillFailed++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        this.deadLetter.push({
          ...action,
          failedAt: Date.now(),
          lastError: errorMsg,
        });
        stillFailed++;
      }
    }

    this.persist();
    return { recovered, stillFailed };
  }

  clear() {
    this.queue = [];
    this.persist();
  }

  clearDeadLetter() {
    this.deadLetter = [];
    this.persist();
  }
}

export const syncQueue = new SyncQueue();
