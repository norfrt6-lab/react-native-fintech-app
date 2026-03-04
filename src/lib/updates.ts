import * as Updates from 'expo-updates';
import { logger } from './logger';

const TAG = 'Updates';

export interface UpdateCheckResult {
  isAvailable: boolean;
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  if (__DEV__) {
    logger.debug(TAG, 'Skipping update check in dev mode');
    return { isAvailable: false };
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      logger.info(TAG, 'Update available');
      return { isAvailable: true };
    }
    return { isAvailable: false };
  } catch (error) {
    logger.error(TAG, 'Update check failed', error);
    return { isAvailable: false };
  }
}

export async function fetchAndApplyUpdate(): Promise<boolean> {
  try {
    const result = await Updates.fetchUpdateAsync();
    if (result.isNew) {
      logger.info(TAG, 'New update fetched, reloading...');
      await Updates.reloadAsync();
      return true;
    }
    return false;
  } catch (error) {
    logger.error(TAG, 'Failed to fetch/apply update', error);
    return false;
  }
}
