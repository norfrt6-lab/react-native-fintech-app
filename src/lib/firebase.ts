import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
import { getConfig } from './config';
import { logger } from './logger';

const TAG = 'Firebase';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;

  const config = getConfig();

  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp({
      apiKey: config.firebaseApiKey,
      authDomain: config.firebaseAuthDomain,
      projectId: config.firebaseProjectId,
    });
  }

  logger.info(TAG, 'Firebase app initialized');
  return app;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;

  const firebaseApp = getFirebaseApp();

  try {
    auth = initializeAuth(firebaseApp);
  } catch {
    // If already initialized, get existing instance
    auth = getAuth(firebaseApp);
  }

  return auth;
}
