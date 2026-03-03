import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  connectivityManager,
  syncQueue,
  type ConnectionStatus,
} from '../core/sync';

interface ConnectivityStore {
  status: ConnectionStatus;
  isInternetReachable: boolean | null;
  pendingSyncCount: number;
  lastSyncAt: number | null;

  initialize: () => () => void;
  syncPendingActions: () => Promise<void>;
}

export const useConnectivityStore = create<ConnectivityStore>()(
  immer((set, get) => ({
    status: 'unknown',
    isInternetReachable: null,
    pendingSyncCount: syncQueue.getPendingCount(),
    lastSyncAt: null,

    initialize: () => {
      connectivityManager.start();

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

      await syncQueue.processQueue(async (_action) => {
        // Process sync actions when backend is available
        // For now, mark all as successful (demo mode)
        return true;
      });

      set((s) => {
        s.pendingSyncCount = syncQueue.getPendingCount();
        s.lastSyncAt = Date.now();
      });
    },
  })),
);
