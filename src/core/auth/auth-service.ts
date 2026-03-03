import * as SecureStore from 'expo-secure-store';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type UserCredential,
  type AuthError,
} from 'firebase/auth';
import type { User } from '../../types';
import { logger } from '../../lib/logger';
import { clearSessionToken, saveSessionToken } from './biometric';
import { getFirebaseAuth } from '../../lib/firebase';

const TAG = 'AuthService';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthResult>;
  register(email: string, password: string, displayName: string): Promise<AuthResult>;
  logout(userId: string): Promise<void>;
  refreshToken(): Promise<string | null>;
}

/**
 * Mock auth service for development and testing.
 * Simulates network delay and returns a demo user.
 */
export class MockAuthService implements AuthService {
  async login(email: string, _password: string): Promise<AuthResult> {
    await this.simulateDelay();

    const user: User = {
      uid: 'demo-user-001',
      email,
      displayName: email.split('@')[0],
      photoURL: null,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };

    await saveSessionToken(`mock-token-${user.uid}`);
    return { success: true, user };
  }

  async register(email: string, _password: string, displayName: string): Promise<AuthResult> {
    await this.simulateDelay();

    const user: User = {
      uid: `user_${Date.now()}`,
      email,
      displayName,
      photoURL: null,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };

    await saveSessionToken(`mock-token-${user.uid}`);
    return { success: true, user };
  }

  async logout(_userId: string): Promise<void> {
    await clearSessionToken();
  }

  async refreshToken(): Promise<string | null> {
    return `mock-refresh-${Date.now()}`;
  }

  private async simulateDelay(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

function mapFirebaseUser(credential: UserCredential): User {
  const fbUser = credential.user;
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? '',
    displayName: fbUser.displayName ?? '',
    photoURL: fbUser.photoURL ?? null,
    emailVerified: fbUser.emailVerified,
    createdAt: fbUser.metadata.creationTime ?? new Date().toISOString(),
  };
}

function mapFirebaseError(error: AuthError): string {
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return 'Authentication failed. Please try again';
  }
}

/**
 * Firebase auth service for production.
 * Uses Firebase JS SDK (modular v10+) for Expo managed workflow compatibility.
 */
export class FirebaseAuthService implements AuthService {
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = mapFirebaseUser(credential);
      const token = await credential.user.getIdToken();
      await saveSessionToken(token);
      logger.info(TAG, `User logged in: ${user.uid}`);
      return { success: true, user };
    } catch (error) {
      const authError = error as AuthError;
      logger.error(TAG, `Login failed: ${authError.code}`, error);
      return { success: false, error: mapFirebaseError(authError) };
    }
  }

  async register(email: string, password: string, displayName: string): Promise<AuthResult> {
    try {
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      if (credential.user) {
        await updateProfile(credential.user, { displayName });
      }

      const user = mapFirebaseUser(credential);
      user.displayName = displayName;
      const token = await credential.user.getIdToken();
      await saveSessionToken(token);
      logger.info(TAG, `User registered: ${user.uid}`);
      return { success: true, user };
    } catch (error) {
      const authError = error as AuthError;
      logger.error(TAG, `Registration failed: ${authError.code}`, error);
      return { success: false, error: mapFirebaseError(authError) };
    }
  }

  async logout(_userId: string): Promise<void> {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      await clearSessionToken();
      await SecureStore.deleteItemAsync('fintrack_session_token');
      logger.info(TAG, 'User logged out');
    } catch (error) {
      logger.error(TAG, 'Logout cleanup failed', error);
      // Still clear local tokens even if Firebase signOut fails
      await clearSessionToken().catch(() => {});
      throw error;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      const token = await currentUser.getIdToken(true);
      await saveSessionToken(token);
      return token;
    } catch (error) {
      logger.error(TAG, 'Token refresh failed', error);
      return null;
    }
  }
}

let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = __DEV__
      ? new MockAuthService()
      : new FirebaseAuthService();
  }
  return authServiceInstance;
}

/**
 * Override the auth service instance (useful for testing).
 */
export function setAuthService(service: AuthService): void {
  authServiceInstance = service;
}
