import { logger } from '../../lib/logger';

const TAG = 'ConflictResolver';

export type ConflictStrategy = 'client-wins' | 'server-wins' | 'last-write-wins' | 'merge';

export interface VersionedData<T = Record<string, unknown>> {
  data: T;
  version: number;
  updatedAt: number;
  deviceId: string;
}

export interface ConflictResult<T = Record<string, unknown>> {
  resolved: boolean;
  data: T;
  strategy: ConflictStrategy;
}

export function resolveConflict<T extends Record<string, unknown>>(
  local: VersionedData<T>,
  remote: VersionedData<T>,
  strategy: ConflictStrategy = 'last-write-wins',
): ConflictResult<T> {
  logger.info(TAG, `Resolving conflict with strategy: ${strategy}`);

  switch (strategy) {
    case 'client-wins':
      return { resolved: true, data: local.data, strategy };

    case 'server-wins':
      return { resolved: true, data: remote.data, strategy };

    case 'last-write-wins':
      return local.updatedAt >= remote.updatedAt
        ? { resolved: true, data: local.data, strategy }
        : { resolved: true, data: remote.data, strategy };

    case 'merge':
      return {
        resolved: true,
        data: mergeData(local.data, remote.data, local.updatedAt, remote.updatedAt),
        strategy,
      };
  }
}

function mergeData<T extends Record<string, unknown>>(
  local: T,
  remote: T,
  localTime: number,
  remoteTime: number,
): T {
  const merged = { ...remote } as T;

  for (const key of Object.keys(local) as Array<keyof T>) {
    if (local[key] !== remote[key]) {
      // For conflicting fields, prefer the more recent change
      (merged as Record<string, unknown>)[key as string] =
        localTime >= remoteTime ? local[key] : remote[key];
    }
  }

  return merged;
}

const ACTION_STRATEGY_MAP: Record<string, ConflictStrategy> = {
  trade: 'client-wins',
  settings: 'last-write-wins',
  watchlist: 'merge',
};

export function getStrategyForAction(actionType: string): ConflictStrategy {
  return ACTION_STRATEGY_MAP[actionType] ?? 'last-write-wins';
}
