export { connectivityManager } from './connectivity';
export type { ConnectionStatus, ConnectivityState } from './connectivity';
export { syncQueue } from './sync-queue';
export type { SyncAction, DeadLetterAction } from './sync-queue';
export { resolveConflict, getStrategyForAction } from './conflict-resolver';
export type { ConflictStrategy, VersionedData, ConflictResult } from './conflict-resolver';
