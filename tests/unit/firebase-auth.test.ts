jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockGetIdToken = jest.fn().mockResolvedValue('firebase-id-token');
const mockCredential = {
  user: {
    uid: 'fb-user-123',
    email: 'test@test.com',
    displayName: 'Test User',
    photoURL: null,
    emailVerified: true,
    metadata: { creationTime: '2024-01-01T00:00:00.000Z' },
    getIdToken: mockGetIdToken,
  },
};

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn().mockResolvedValue(mockCredential),
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue(mockCredential),
  signOut: jest.fn().mockResolvedValue(undefined),
  updateProfile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/lib/firebase', () => ({
  getFirebaseAuth: jest.fn().mockReturnValue({
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('refreshed-token'),
    },
  }),
}));

jest.mock('../../src/core/auth/biometric', () => ({
  saveSessionToken: jest.fn().mockResolvedValue(undefined),
  clearSessionToken: jest.fn().mockResolvedValue(undefined),
}));

import { FirebaseAuthService } from '../../src/core/auth/auth-service';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { saveSessionToken, clearSessionToken } from '../../src/core/auth/biometric';

describe('FirebaseAuthService', () => {
  let service: FirebaseAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FirebaseAuthService();
  });

  describe('login', () => {
    it('returns user on successful login', async () => {
      const result = await service.login('test@test.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.uid).toBe('fb-user-123');
      expect(result.user!.email).toBe('test@test.com');
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
      expect(saveSessionToken).toHaveBeenCalledWith('firebase-id-token');
    });

    it('returns error on invalid credentials', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/wrong-password',
        message: 'Wrong password',
      });

      const result = await service.login('test@test.com', 'wrong');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('returns error on user not found', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/user-not-found',
        message: 'User not found',
      });

      const result = await service.login('nobody@test.com', 'pass');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('returns generic error for unknown Firebase errors', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/internal-error',
        message: 'Internal error',
      });

      const result = await service.login('test@test.com', 'pass');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed. Please try again');
    });
  });

  describe('register', () => {
    it('creates user and updates display name', async () => {
      const result = await service.register('new@test.com', 'pass123', 'New User');

      expect(result.success).toBe(true);
      expect(result.user!.displayName).toBe('New User');
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(updateProfile).toHaveBeenCalledWith(
        mockCredential.user,
        { displayName: 'New User' },
      );
      expect(saveSessionToken).toHaveBeenCalledWith('firebase-id-token');
    });

    it('returns error when email already in use', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/email-already-in-use',
        message: 'Email in use',
      });

      const result = await service.register('taken@test.com', 'pass', 'User');
      expect(result.success).toBe(false);
      expect(result.error).toBe('An account with this email already exists');
    });

    it('returns error for weak password', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
        code: 'auth/weak-password',
        message: 'Weak password',
      });

      const result = await service.register('test@test.com', '123', 'User');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is too weak. Use at least 6 characters');
    });
  });

  describe('logout', () => {
    it('signs out and clears tokens', async () => {
      await service.logout('fb-user-123');

      expect(signOut).toHaveBeenCalled();
      expect(clearSessionToken).toHaveBeenCalled();
    });

    it('still clears local tokens if Firebase signOut fails', async () => {
      (signOut as jest.Mock).mockRejectedValueOnce(new Error('network error'));

      await expect(service.logout('fb-user-123')).rejects.toThrow();
      expect(clearSessionToken).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('returns refreshed token from current user', async () => {
      const token = await service.refreshToken();
      expect(token).toBe('refreshed-token');
      expect(saveSessionToken).toHaveBeenCalledWith('refreshed-token');
    });

    it('returns null when no current user', async () => {
      const { getFirebaseAuth } = require('../../src/lib/firebase');
      (getFirebaseAuth as jest.Mock).mockReturnValueOnce({ currentUser: null });

      const token = await service.refreshToken();
      expect(token).toBeNull();
    });
  });
});
