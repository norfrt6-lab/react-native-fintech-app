import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { logger } from '../../lib/logger';

export type ConnectionStatus = 'online' | 'offline' | 'unknown';

export interface ConnectivityState {
  status: ConnectionStatus;
  type: string | null;
  isInternetReachable: boolean | null;
}

type ConnectivityListener = (state: ConnectivityState) => void;

class ConnectivityManager {
  private listeners: Set<ConnectivityListener> = new Set();
  private unsubscribe: NetInfoSubscription | null = null;
  private currentState: ConnectivityState = {
    status: 'unknown',
    type: null,
    isInternetReachable: null,
  };

  start() {
    if (this.unsubscribe) return;

    this.unsubscribe = NetInfo.addEventListener(this.handleStateChange);
    logger.info('Connectivity', 'Monitoring started');
  }

  stop() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    logger.info('Connectivity', 'Monitoring stopped');
  }

  getState(): ConnectivityState {
    return this.currentState;
  }

  async refresh(): Promise<ConnectivityState> {
    const state = await NetInfo.fetch();
    this.handleStateChange(state);
    return this.currentState;
  }

  subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => this.listeners.delete(listener);
  }

  private handleStateChange = (state: NetInfoState) => {
    const newStatus: ConnectionStatus = state.isConnected
      ? 'online'
      : state.isConnected === false
        ? 'offline'
        : 'unknown';

    const newState: ConnectivityState = {
      status: newStatus,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    };

    const wasOffline = this.currentState.status === 'offline';
    const isNowOnline = newStatus === 'online';

    this.currentState = newState;

    if (wasOffline && isNowOnline) {
      logger.info('Connectivity', 'Connection restored');
    } else if (newStatus === 'offline') {
      logger.warn('Connectivity', 'Connection lost');
    }

    this.listeners.forEach((listener) => listener(newState));
  };
}

export const connectivityManager = new ConnectivityManager();
