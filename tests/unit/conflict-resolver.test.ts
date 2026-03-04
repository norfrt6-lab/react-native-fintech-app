jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import {
  resolveConflict,
  getStrategyForAction,
  type VersionedData,
} from '../../src/core/sync/conflict-resolver';

describe('ConflictResolver', () => {
  const localData: VersionedData = {
    data: { name: 'local-settings', theme: 'dark', currency: 'usd' },
    version: 2,
    updatedAt: 1000,
    deviceId: 'device-a',
  };

  const remoteData: VersionedData = {
    data: { name: 'remote-settings', theme: 'light', currency: 'eur' },
    version: 3,
    updatedAt: 2000,
    deviceId: 'device-b',
  };

  describe('client-wins strategy', () => {
    it('always returns local data', () => {
      const result = resolveConflict(localData, remoteData, 'client-wins');
      expect(result.resolved).toBe(true);
      expect(result.data).toEqual(localData.data);
      expect(result.strategy).toBe('client-wins');
    });
  });

  describe('server-wins strategy', () => {
    it('always returns remote data', () => {
      const result = resolveConflict(localData, remoteData, 'server-wins');
      expect(result.resolved).toBe(true);
      expect(result.data).toEqual(remoteData.data);
      expect(result.strategy).toBe('server-wins');
    });
  });

  describe('last-write-wins strategy', () => {
    it('returns remote data when remote is newer', () => {
      const result = resolveConflict(localData, remoteData, 'last-write-wins');
      expect(result.data).toEqual(remoteData.data);
    });

    it('returns local data when local is newer', () => {
      const newerLocal = { ...localData, updatedAt: 3000 };
      const result = resolveConflict(newerLocal, remoteData, 'last-write-wins');
      expect(result.data).toEqual(newerLocal.data);
    });

    it('returns local data when timestamps are equal', () => {
      const sameTime = { ...localData, updatedAt: 2000 };
      const result = resolveConflict(sameTime, remoteData, 'last-write-wins');
      expect(result.data).toEqual(sameTime.data);
    });

    it('is the default strategy', () => {
      const result = resolveConflict(localData, remoteData);
      expect(result.strategy).toBe('last-write-wins');
    });
  });

  describe('merge strategy', () => {
    it('combines data from both sources', () => {
      const local: VersionedData = {
        data: { a: 'local', b: 'shared', c: 'local-only' },
        version: 1,
        updatedAt: 2000,
        deviceId: 'dev-a',
      };
      const remote: VersionedData = {
        data: { a: 'remote', b: 'shared', d: 'remote-only' },
        version: 1,
        updatedAt: 1000,
        deviceId: 'dev-b',
      };

      const result = resolveConflict(local, remote, 'merge');
      expect(result.resolved).toBe(true);
      // 'b' is same in both, kept as-is
      expect(result.data.b).toBe('shared');
      // 'a' differs, local is newer → local wins
      expect(result.data.a).toBe('local');
      // 'c' only in local, should be in merged
      expect(result.data.c).toBe('local-only');
      // 'd' only in remote, should be in merged (base is remote)
      expect(result.data.d).toBe('remote-only');
    });

    it('uses recency for conflicting fields', () => {
      const local: VersionedData = {
        data: { theme: 'dark' },
        version: 1,
        updatedAt: 500,
        deviceId: 'dev-a',
      };
      const remote: VersionedData = {
        data: { theme: 'light' },
        version: 1,
        updatedAt: 1000,
        deviceId: 'dev-b',
      };

      const result = resolveConflict(local, remote, 'merge');
      // remote is newer, so remote's value wins
      expect(result.data.theme).toBe('light');
    });
  });

  describe('getStrategyForAction', () => {
    it('returns client-wins for trade', () => {
      expect(getStrategyForAction('trade')).toBe('client-wins');
    });

    it('returns last-write-wins for settings', () => {
      expect(getStrategyForAction('settings')).toBe('last-write-wins');
    });

    it('returns merge for watchlist', () => {
      expect(getStrategyForAction('watchlist')).toBe('merge');
    });

    it('defaults to last-write-wins for unknown types', () => {
      expect(getStrategyForAction('unknown')).toBe('last-write-wins');
    });
  });
});
