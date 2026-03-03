import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  connectivityManager,
  syncQueue,
  type ConnectionStatus,
  type SyncAction,
} from '../core/sync';
import { logger } from '../lib/logger';

const TAG = 'ConnectivityStore';

interface ConnectivityStore {
  status: ConnectionStatus;
  isInternetReachable: boolean | null;
  pendingSyncCount: number;
  failedSyncCount: number;
  lastSyncAt: number | null;

  initialize: () => () => void;
  syncPendingActions: () => Promise<void>;
  retryFailedActions: () => Promise<void>;
  getFailedSyncCount: () => number;
}

async function processAction(action: SyncAction): Promise<boolean> {
  // Route sync actions to appropriate handlers based on action type
  switch (action.type) {
    case 'trade':
      // Trade sync would send trade data to the backend
      // In production, this would call the trade API
      logger.info(TAG, `Processing trade sync: ${action.id}`);
      return true;

    case 'settings':
      // Settings sync would push user preferences to the backend
      logger.info(TAG, `Processing settings sync: ${action.id}`);
      return true;

    case 'watchlist':
      // Watchlist sync would update the user's watchlist on the backend
      logger.info(TAG, `Processing watchlist sync: ${action.id}`);
      return true;

    default:
      logger.warn(TAG, `Unknown sync action type: ${action.type}`);
      return false;
  }
}

export const useConnectivityStore = create<ConnectivityStore>()(
  immer((set, get) => ({
    status: 'unknown',
    isInternetReachable: null,
    pendingSyncCount: 0,
    failedSyncCount: 0,
    lastSyncAt: null,

    initialize: () => {
      connectivityManager.start();

      // Update counts after storage is ready
      set((s) => {
        s.pendingSyncCount = syncQueue.getPendingCount();
        s.failedSyncCount = syncQueue.getFailedCount();
      });

      const unsubscribe = connectivityManager.subscribe((state) => {
        const wasOffline = get().status === 'offline';

        set((s) => {
          s.status = state.status;
          s.isInternetReachable = state.isInternetReachable;
        });

        if (wasOffline && state.status === 'online') {
          get().syncPendingActions();
        }
      });

      return () => {
        unsubscribe();
        connectivityManager.stop();
      };
    },

    syncPendingActions: async () => {
      if (get().status !== 'online') return;

      const result = await syncQueue.processQueue(processAction);
      logger.info(TAG, `Sync complete: ${result.processed} processed, ${result.failed} failed`);

      set((s) => {
        s.pendingSyncCount = syncQueue.getPendingCount();
        s.failedSyncCount = syncQueue.getFailedCount();
        s.lastSyncAt = Date.now();
      });
    },

    retryFailedActions: async () => {
      if (get().status !== 'online') return;

      const result = await syncQueue.retryFailed(processAction);
      logger.info(TAG, `Retry complete: ${result.recovered} recovered, ${result.stillFailed} still failed`);

      set((s) => {
        s.pendingSyncCount = syncQueue.getPendingCount();
        s.failedSyncCount = syncQueue.getFailedCount();
        s.lastSyncAt = Date.now();
      });
    },

    getFailedSyncCount: () => syncQueue.getFailedCount(),
  })),
);
