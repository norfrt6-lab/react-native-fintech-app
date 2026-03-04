jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// Override the global expo-crypto mock to produce input-dependent hashes
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockImplementation((_alg: string, input: string) =>
    Promise.resolve(`hash_${input}`),
  ),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

import * as SecureStore from 'expo-secure-store';
import { savePin, verifyPin, removePin, isPinSet, checkLockout, recordFailedAttempt, resetAttempts } from '../../src/core/auth/pin';

describe('PIN Authentication', () => {
  const secureStoreData = new Map<string, string>();

  beforeEach(() => {
    jest.clearAllMocks();
    secureStoreData.clear();

    (SecureStore.setItemAsync as jest.Mock).mockImplementation(
      (key: string, value: string) => {
        secureStoreData.set(key, value);
        return Promise.resolve();
      },
    );
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(
      (key: string) => Promise.resolve(secureStoreData.get(key) ?? null),
    );
    (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(
      (key: string) => {
        secureStoreData.delete(key);
        return Promise.resolve();
      },
    );
  });

  describe('savePin / isPinSet', () => {
    it('saves a PIN and marks it as set', async () => {
      expect(await isPinSet()).toBe(false);
      await savePin('123456');
      expect(await isPinSet()).toBe(true);
    });
  });

  describe('verifyPin', () => {
    it('returns true for correct PIN', async () => {
      await savePin('654321');
      expect(await verifyPin('654321')).toBe(true);
    });

    it('returns false for incorrect PIN', async () => {
      await savePin('654321');
      expect(await verifyPin('000000')).toBe(false);
    });

    it('returns false when no PIN is set', async () => {
      expect(await verifyPin('123456')).toBe(false);
    });
  });

  describe('removePin', () => {
    it('removes the stored PIN', async () => {
      await savePin('123456');
      expect(await isPinSet()).toBe(true);
      await removePin();
      expect(await isPinSet()).toBe(false);
    });
  });

  describe('recordFailedAttempt / checkLockout', () => {
    it('tracks failed attempts and returns remaining count', async () => {
      const result = await recordFailedAttempt();
      expect(result.locked).toBe(false);
      expect(result.attemptsLeft).toBe(4);
    });

    it('locks out after 5 failed attempts', async () => {
      for (let i = 0; i < 4; i++) {
        await recordFailedAttempt();
      }
      const result = await recordFailedAttempt();
      expect(result.locked).toBe(true);
      expect(result.attemptsLeft).toBe(0);
    });

    it('checkLockout detects active lockout', async () => {
      for (let i = 0; i < 5; i++) {
        await recordFailedAttempt();
      }
      const lockout = await checkLockout();
      expect(lockout.locked).toBe(true);
      expect(lockout.remainingMs).toBeGreaterThan(0);
    });

    it('checkLockout returns false when no lockout', async () => {
      const lockout = await checkLockout();
      expect(lockout.locked).toBe(false);
      expect(lockout.remainingMs).toBe(0);
    });
  });

  describe('resetAttempts', () => {
    it('clears attempt count and lockout', async () => {
      for (let i = 0; i < 5; i++) {
        await recordFailedAttempt();
      }
      await resetAttempts();
      const lockout = await checkLockout();
      expect(lockout.locked).toBe(false);
    });
  });
});
