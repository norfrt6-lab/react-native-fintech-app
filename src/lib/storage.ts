import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

export const storage = new MMKV({
  id: 'fintech-app-storage',
  encryptionKey: 'fintech-secure-key-v1',
});

export const zustandStorage: StateStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
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
