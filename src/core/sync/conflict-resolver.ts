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
  local: VersionedData<T> | null | undefined,
  remote: VersionedData<T> | null | undefined,
  strategy: ConflictStrategy = 'last-write-wins',
): ConflictResult<T> {
  if (!local && !remote) {
    logger.warn(TAG, 'Both local and remote are null');
    return { resolved: false, data: {} as T, strategy };
  }
  if (!local) {
    logger.info(TAG, 'Local is null, using remote');
    return { resolved: true, data: remote!.data, strategy: 'server-wins' };
  }
  if (!remote) {
    logger.info(TAG, 'Remote is null, using local');
    return { resolved: true, data: local.data, strategy: 'client-wins' };
  }

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(
  local: Record<string, unknown>,
  remote: Record<string, unknown>,
  localTime: number,
  remoteTime: number,
): Record<string, unknown> {
  const merged = { ...remote };

  for (const key of Object.keys(local)) {
    const localVal = local[key];
    const remoteVal = remote[key];

    if (localVal === remoteVal) continue;

    // Both are plain objects: recurse
    if (isPlainObject(localVal) && isPlainObject(remoteVal)) {
      merged[key] = deepMerge(localVal, remoteVal, localTime, remoteTime);
    } else if (!(key in remote)) {
      // Key only in local
      merged[key] = localVal;
    } else if (typeof localVal !== typeof remoteVal) {
      // Type mismatch: prefer the non-null/non-undefined value, or recency
      if (localVal == null) {
        merged[key] = remoteVal;
      } else if (remoteVal == null) {
        merged[key] = localVal;
      } else {
        merged[key] = localTime >= remoteTime ? localVal : remoteVal;
      }
    } else {
      // Same type, different values: prefer the more recent change
      merged[key] = localTime >= remoteTime ? localVal : remoteVal;
    }
  }

  return merged;
}

function mergeData<T extends Record<string, unknown>>(
  local: T,
  remote: T,
  localTime: number,
  remoteTime: number,
): T {
  return deepMerge(local, remote, localTime, remoteTime) as T;
}

const ACTION_STRATEGY_MAP: Record<string, ConflictStrategy> = {
  trade: 'client-wins',
  settings: 'last-write-wins',
  watchlist: 'merge',
};

export function getStrategyForAction(actionType: string): ConflictStrategy {
  return ACTION_STRATEGY_MAP[actionType] ?? 'last-write-wins';
}
