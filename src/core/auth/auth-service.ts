import * as SecureStore from 'expo-secure-store';
import type { User } from '../../types';
import { logger } from '../../lib/logger';
import { clearSessionToken, saveSessionToken } from './biometric';

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

/**
 * Firebase auth service for production.
 * Placeholder that can be implemented when Firebase is configured.
 */
export class FirebaseAuthService implements AuthService {
  async login(_email: string, _password: string): Promise<AuthResult> {
    // TODO: Implement Firebase Auth signInWithEmailAndPassword
    logger.warn(TAG, 'FirebaseAuthService.login not yet implemented');
    return { success: false, error: 'Firebase auth not configured' };
  }

  async register(_email: string, _password: string, _displayName: string): Promise<AuthResult> {
    // TODO: Implement Firebase Auth createUserWithEmailAndPassword
    logger.warn(TAG, 'FirebaseAuthService.register not yet implemented');
    return { success: false, error: 'Firebase auth not configured' };
  }

  async logout(_userId: string): Promise<void> {
    try {
      await clearSessionToken();
      await SecureStore.deleteItemAsync('fintrack_session_token');
      // TODO: Firebase signOut
    } catch (error) {
      logger.error(TAG, 'Logout cleanup failed', error);
      throw error;
    }
  }

  async refreshToken(): Promise<string | null> {
    // TODO: Firebase getIdToken(true)
    return null;
  }
}

let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    // Use MockAuthService in dev, can switch to Firebase in production
    authServiceInstance = __DEV__
      ? new MockAuthService()
      : new MockAuthService(); // Replace with FirebaseAuthService when configured
  }
  return authServiceInstance;
}

/**
 * Override the auth service instance (useful for testing).
 */
export function setAuthService(service: AuthService): void {
  authServiceInstance = service;
}
