import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirestoreDb } from '../../lib/firestore';
import { logger } from '../../lib/logger';
import { getCrashReporter } from '../../lib/crash-reporter';

const TAG = 'UserDataService';

type DataKey = 'portfolio' | 'trades' | 'watchlist' | 'settings' | 'alerts';

function getUserDocRef(uid: string, key: DataKey) {
  return doc(getFirestoreDb(), 'users', uid, 'data', key);
}

export async function syncUserData(
  uid: string,
  key: DataKey,
  data: Record<string, unknown>,
): Promise<boolean> {
  try {
    const ref = getUserDocRef(uid, key);
    await setDoc(ref, { ...data, updatedAt: Date.now() });
    logger.info(TAG, `Synced ${key} for user ${uid}`);
    return true;
  } catch (error) {
    logger.error(TAG, `Failed to sync ${key}`, error);
    getCrashReporter().captureException(
      error instanceof Error ? error : new Error(`Failed to sync ${key}`),
      { uid, key },
    );
    return false;
  }
}

export async function fetchUserData(
  uid: string,
  key: DataKey,
): Promise<Record<string, unknown> | null> {
  try {
    const ref = getUserDocRef(uid, key);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      logger.info(TAG, `Fetched ${key} for user ${uid}`);
      return snapshot.data() as Record<string, unknown>;
    }
    logger.info(TAG, `No ${key} data found for user ${uid}`);
    return null;
  } catch (error) {
    logger.error(TAG, `Failed to fetch ${key}`, error);
    getCrashReporter().captureException(
      error instanceof Error ? error : new Error(`Failed to fetch ${key}`),
      { uid, key },
    );
    return null;
  }
}

export async function syncPortfolio(
  uid: string,
  portfolio: { holdings: unknown[]; balance: number; history: unknown[] },
): Promise<boolean> {
  return syncUserData(uid, 'portfolio', portfolio as Record<string, unknown>);
}

export async function fetchPortfolio(uid: string) {
  return fetchUserData(uid, 'portfolio');
}

export async function syncTrades(
  uid: string,
  trades: { transactions: unknown[] },
): Promise<boolean> {
  return syncUserData(uid, 'trades', trades as Record<string, unknown>);
}

export async function fetchTrades(uid: string) {
  return fetchUserData(uid, 'trades');
}

export async function syncWatchlist(
  uid: string,
  watchlist: { items: string[] },
): Promise<boolean> {
  return syncUserData(uid, 'watchlist', watchlist as Record<string, unknown>);
}

export async function fetchWatchlist(uid: string) {
  return fetchUserData(uid, 'watchlist');
}

export async function syncSettings(
  uid: string,
  settings: Record<string, unknown>,
): Promise<boolean> {
  return syncUserData(uid, 'settings', settings);
}

export async function fetchSettings(uid: string) {
  return fetchUserData(uid, 'settings');
}

export async function syncAlerts(
  uid: string,
  alerts: { items: unknown[] },
): Promise<boolean> {
  return syncUserData(uid, 'alerts', alerts as Record<string, unknown>);
}

export async function fetchAlerts(uid: string) {
  return fetchUserData(uid, 'alerts');
}
