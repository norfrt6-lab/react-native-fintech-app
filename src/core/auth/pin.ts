import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { AUTH } from '../../lib/constants';

const PIN_HASH_KEY = 'fintrack_pin_hash';
const PIN_ATTEMPTS_KEY = 'fintrack_pin_attempts';
const PIN_LOCKOUT_KEY = 'fintrack_pin_lockout';

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export async function savePin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
  await resetAttempts();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPin(pin);
  return inputHash === storedHash;
}

export async function removePin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_HASH_KEY);
  await resetAttempts();
}

export async function isPinSet(): Promise<boolean> {
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  return hash !== null;
}

export async function checkLockout(): Promise<{ locked: boolean; remainingMs: number }> {
  const lockoutStr = await SecureStore.getItemAsync(PIN_LOCKOUT_KEY);
  if (!lockoutStr) return { locked: false, remainingMs: 0 };

  const lockoutTime = parseInt(lockoutStr, 10);
  const remainingMs = lockoutTime + AUTH.LOCKOUT_DURATION - Date.now();

  if (remainingMs <= 0) {
    await SecureStore.deleteItemAsync(PIN_LOCKOUT_KEY);
    await resetAttempts();
    return { locked: false, remainingMs: 0 };
  }

  return { locked: true, remainingMs };
}

export async function recordFailedAttempt(): Promise<{ locked: boolean; attemptsLeft: number }> {
  const attemptsStr = await SecureStore.getItemAsync(PIN_ATTEMPTS_KEY);
  const attempts = attemptsStr ? parseInt(attemptsStr, 10) + 1 : 1;

  await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, attempts.toString());

  if (attempts >= AUTH.MAX_PIN_ATTEMPTS) {
    await SecureStore.setItemAsync(PIN_LOCKOUT_KEY, Date.now().toString());
    return { locked: true, attemptsLeft: 0 };
  }

  return { locked: false, attemptsLeft: AUTH.MAX_PIN_ATTEMPTS - attempts };
}

export async function resetAttempts(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
  await SecureStore.deleteItemAsync(PIN_LOCKOUT_KEY);
}
