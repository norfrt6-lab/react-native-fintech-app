import { createMMKV, MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { StateStorage } from 'zustand/middleware';
import { logger } from './logger';

const TAG = 'Storage';
const ENCRYPTION_KEY_ALIAS = 'fintrack_mmkv_encryption_key';

const FALLBACK_KEY_STORAGE_ID = 'fintrack-fallback-keystore';
const FALLBACK_KEY_NAME = 'device_fallback_key';

/**
 * Device-specific fallback key: stored in a separate non-encrypted MMKV instance.
 * Each device gets a unique random key on first fallback, avoiding a universal static key.
 */
function getDeviceFallbackKey(): string {
  try {
    const fallbackStore = createMMKV({ id: FALLBACK_KEY_STORAGE_ID });
    const existing = fallbackStore.getString(FALLBACK_KEY_NAME);
    if (existing) return existing;

    const key = 'fb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    fallbackStore.set(FALLBACK_KEY_NAME, key);
    logger.warn(TAG, 'Generated device-specific fallback encryption key');
    return key;
  } catch {
    logger.error(TAG, 'Fallback MMKV also failed, using last-resort key');
    return 'fintrack-fallback-' + ENCRYPTION_KEY_ALIAS;
  }
}

let storage: MMKV;

async function getOrCreateEncryptionKey(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
    if (existing) {
      return existing;
    }

    const randomBytes = await Crypto.getRandomBytesAsync(32);
    const key = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, key);
    logger.info(TAG, 'Generated new MMKV encryption key');
    return key;
  } catch (error) {
    logger.error(TAG, 'Failed to access SecureStore for encryption key', error);
    return getDeviceFallbackKey();
  }
}

/**
 * Initialize MMKV storage with a securely-generated encryption key.
 * Must be called before any store or storage access.
 */
export async function initializeStorage(): Promise<void> {
  if (storage) return;

  const encryptionKey = await getOrCreateEncryptionKey();
  storage = createMMKV({
    id: 'fintech-app-storage',
    encryptionKey,
  });
  logger.info(TAG, 'MMKV storage initialized');
}

/**
 * Get the MMKV storage instance. Throws if not initialized.
 */
export function getStorage(): MMKV {
  if (!storage) {
    throw new Error(
      'Storage not initialized. Call initializeStorage() before accessing storage.',
    );
  }
  return storage;
}

export const zustandStorage: StateStorage = {
  getItem: (name: string) => {
    const value = getStorage().getString(name);
    return value ?? null;
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
