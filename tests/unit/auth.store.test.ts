jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockStorage = new Map<string, string>();
jest.mock('../../src/lib/storage', () => ({
  zustandStorage: {
    getItem: (name: string) => mockStorage.get(name) ?? null,
    setItem: (name: string, value: string) => mockStorage.set(name, value),
    removeItem: (name: string) => mockStorage.delete(name),
  },
  initializeStorage: jest.fn().mockResolvedValue(undefined),
  getStorage: jest.fn(),
  StorageKeys: {},
}));

jest.mock('../../src/core/auth/auth-service', () => {
  const mockService = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  };
  return {
    getAuthService: () => mockService,
    setAuthService: jest.fn(),
    __mockService: mockService,
  };
});

import { useAuthStore } from '../../src/store/auth.store';
import type { User, SecuritySettings } from '../../src/types';

const { __mockService: mockAuthService } = jest.requireMock('../../src/core/auth/auth-service');

const mockUser: User = {
  uid: 'test-user-001',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

const defaultSecuritySettings: SecuritySettings = {
  biometricEnabled: false,
  biometricType: 'none',
  pinEnabled: false,
  autoLockTimeout: 5,
  screenshotPrevention: false,
  hideBalance: false,
};

function resetStore() {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isLocked: false,
    securitySettings: { ...defaultSecuritySettings },
    lastActiveAt: null,
  });
}

describe('AuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLocked).toBe(false);
      expect(state.lastActiveAt).toBeNull();
      expect(state.securitySettings).toEqual(defaultSecuritySettings);
    });
  });

  describe('setUser', () => {
    it('sets user and marks as authenticated', () => {
      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('clears user and marks as unauthenticated when null', () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLocked', () => {
    it('locks the app', () => {
      useAuthStore.getState().setLocked(true);
      expect(useAuthStore.getState().isLocked).toBe(true);
    });

    it('unlocks the app', () => {
      useAuthStore.getState().setLocked(true);
      useAuthStore.getState().setLocked(false);
      expect(useAuthStore.getState().isLocked).toBe(false);
    });
  });

  describe('updateLastActive', () => {
    it('sets lastActiveAt to current timestamp', () => {
      const before = Date.now();
      useAuthStore.getState().updateLastActive();
      const after = Date.now();

      const lastActive = useAuthStore.getState().lastActiveAt!;
      expect(lastActive).toBeGreaterThanOrEqual(before);
      expect(lastActive).toBeLessThanOrEqual(after);
    });
  });

  describe('updateSecuritySettings', () => {
    it('partially updates security settings', () => {
      useAuthStore.getState().updateSecuritySettings({
        biometricEnabled: true,
        biometricType: 'fingerprint',
      });

      const settings = useAuthStore.getState().securitySettings;
      expect(settings.biometricEnabled).toBe(true);
      expect(settings.biometricType).toBe('fingerprint');
      expect(settings.autoLockTimeout).toBe(5); // unchanged
    });

    it('updates auto lock timeout', () => {
      useAuthStore.getState().updateSecuritySettings({ autoLockTimeout: 15 });
      expect(useAuthStore.getState().securitySettings.autoLockTimeout).toBe(15);
    });
  });

  describe('login', () => {
    it('sets user on successful login', async () => {
      mockAuthService.login.mockResolvedValue({ success: true, user: mockUser });

      const result = await useAuthStore.getState().login('test@example.com', 'password');

      expect(result).toEqual({ success: true });
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('returns error on failed login', async () => {
      mockAuthService.login.mockResolvedValue({ success: false, error: 'Invalid credentials' });

      const result = await useAuthStore.getState().login('test@example.com', 'wrong');

      expect(result).toEqual({ success: false, error: 'Invalid credentials' });
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('returns generic error on exception', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Network error'));

      const result = await useAuthStore.getState().login('test@example.com', 'password');

      expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading true during login', async () => {
      let resolveLogin: (v: unknown) => void;
      mockAuthService.login.mockImplementation(
        () => new Promise((resolve) => { resolveLogin = resolve; }),
      );

      const loginPromise = useAuthStore.getState().login('test@example.com', 'password');
      // isLoading should be true while waiting
      expect(useAuthStore.getState().isLoading).toBe(true);

      resolveLogin!({ success: true, user: mockUser });
      await loginPromise;
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('sets user on successful registration', async () => {
      mockAuthService.register.mockResolvedValue({ success: true, user: mockUser });

      const result = await useAuthStore.getState().register('test@example.com', 'password', 'Test');

      expect(result).toEqual({ success: true });
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('returns error on failed registration', async () => {
      mockAuthService.register.mockResolvedValue({ success: false, error: 'Email taken' });

      const result = await useAuthStore.getState().register('test@example.com', 'password', 'Test');

      expect(result).toEqual({ success: false, error: 'Email taken' });
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('returns generic error on exception', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Server down'));

      const result = await useAuthStore.getState().register('test@example.com', 'password', 'Test');

      expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
    });
  });

  describe('logout', () => {
    it('clears all auth state', async () => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLocked: true,
        lastActiveAt: Date.now(),
      });
      mockAuthService.logout.mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLocked).toBe(false);
      expect(state.lastActiveAt).toBeNull();
    });

    it('clears state even when auth service throws', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      mockAuthService.logout.mockRejectedValue(new Error('Cleanup failed'));

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
