import { StateStorage } from 'zustand/middleware';
import { logger } from './logger';

const TAG = 'Storage';

// Web uses localStorage as a simple fallback for MMKV
export interface MMKV {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): string[];
}

class WebStorage implements MMKV {
  private prefix: string;

  constructor(id: string) {
    this.prefix = `fintrack_${id}_`;
  }

  getString(key: string): string | undefined {
    return localStorage.getItem(this.prefix + key) ?? undefined;
  }

  set(key: string, value: string): void {
    localStorage.setItem(this.prefix + key, value);
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  contains(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }

  getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(this.prefix)) {
        keys.push(k.slice(this.prefix.length));
      }
    }
    return keys;
  }
}

let storage: MMKV;

export async function initializeStorage(): Promise<void> {
  if (storage) return;
  storage = new WebStorage('app');
  logger.info(TAG, 'Web localStorage initialized');
}

export function getStorage(): MMKV {
  if (!storage) {
    // Auto-init on web to avoid crashes
    storage = new WebStorage('app');
  }
  return storage;
}

export const zustandStorage: StateStorage = {
  getItem: (name: string) => {
    return getStorage().getString(name) ?? null;
  },
  setItem: (name: string, value: string) => {
    getStorage().set(name, value);
  },
  removeItem: (name: string) => {
    getStorage().remove(name);
  },
};

export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  PIN_HASH: 'pin_hash',
  THEME: 'theme',
  LANGUAGE: 'language',
  CURRENCY: 'currency',
  WATCHLIST: 'watchlist',
  LAST_SYNC: 'last_sync',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  AUTO_LOCK_TIMEOUT: 'auto_lock_timeout',
  HIDE_BALANCE: 'hide_balance',
} as const;
