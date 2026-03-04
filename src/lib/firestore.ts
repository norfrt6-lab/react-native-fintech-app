import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFirebaseApp } from './firebase';
import { logger } from './logger';

const TAG = 'Firestore';

let db: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (db) return db;

  const app = getFirebaseApp();
  db = getFirestore(app);

  logger.info(TAG, 'Firestore initialized');
  return db;
}
