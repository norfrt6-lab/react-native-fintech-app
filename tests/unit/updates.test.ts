jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn().mockResolvedValue({ isAvailable: false }),
  fetchUpdateAsync: jest.fn().mockResolvedValue({ isNew: false }),
  reloadAsync: jest.fn().mockResolvedValue(undefined),
}));

import { checkForUpdates, fetchAndApplyUpdate } from '../../src/lib/updates';
import * as Updates from 'expo-updates';

describe('Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkForUpdates', () => {
    it('returns isAvailable: false in dev mode', async () => {
      (globalThis as Record<string, unknown>).__DEV__ = true;
      const result = await checkForUpdates();
      expect(result.isAvailable).toBe(false);
      expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();
    });

    it('checks for updates in production', async () => {
      (globalThis as Record<string, unknown>).__DEV__ = false;
      (Updates.checkForUpdateAsync as jest.Mock).mockResolvedValueOnce({ isAvailable: true });

      const result = await checkForUpdates();
      expect(result.isAvailable).toBe(true);
      expect(Updates.checkForUpdateAsync).toHaveBeenCalled();
      (globalThis as Record<string, unknown>).__DEV__ = true;
    });

    it('returns false on error', async () => {
      (globalThis as Record<string, unknown>).__DEV__ = false;
      (Updates.checkForUpdateAsync as jest.Mock).mockRejectedValueOnce(new Error('network'));

      const result = await checkForUpdates();
      expect(result.isAvailable).toBe(false);
      (globalThis as Record<string, unknown>).__DEV__ = true;
    });
  });

  describe('fetchAndApplyUpdate', () => {
    it('returns true and reloads when update is new', async () => {
      (Updates.fetchUpdateAsync as jest.Mock).mockResolvedValueOnce({ isNew: true });

      const result = await fetchAndApplyUpdate();
      expect(result).toBe(true);
      expect(Updates.reloadAsync).toHaveBeenCalled();
    });

    it('returns false when no new update', async () => {
      (Updates.fetchUpdateAsync as jest.Mock).mockResolvedValueOnce({ isNew: false });

      const result = await fetchAndApplyUpdate();
      expect(result).toBe(false);
      expect(Updates.reloadAsync).not.toHaveBeenCalled();
    });
  });
});
