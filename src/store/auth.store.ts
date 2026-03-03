import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { zustandStorage } from '../lib/storage';
import { getAuthService } from '../core/auth/auth-service';
import { logger } from '../lib/logger';
import type { User, SecuritySettings } from '../types';

const TAG = 'AuthStore';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLocked: boolean;
  securitySettings: SecuritySettings;
  lastActiveAt: number | null;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setLocked: (locked: boolean) => void;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  updateLastActive: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const defaultSecuritySettings: SecuritySettings = {
  biometricEnabled: false,
  biometricType: 'none',
  pinEnabled: false,
  autoLockTimeout: 5,
  screenshotPrevention: false,
  hideBalance: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isLocked: false,
      securitySettings: defaultSecuritySettings,
      lastActiveAt: null,

      setUser: (user) =>
        set((state) => {
          state.user = user;
          state.isAuthenticated = user !== null;
          state.isLoading = false;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setLocked: (locked) =>
        set((state) => {
          state.isLocked = locked;
        }),

      updateSecuritySettings: (settings) =>
        set((state) => {
          state.securitySettings = { ...state.securitySettings, ...settings };
        }),

      updateLastActive: () =>
        set((state) => {
          state.lastActiveAt = Date.now();
        }),

      login: async (email, password) => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          const authService = getAuthService();
          const result = await authService.login(email, password);

          if (result.success && result.user) {
            set((state) => {
              state.user = result.user!;
              state.isAuthenticated = true;
              state.isLoading = false;
            });
            return { success: true };
          }

          set((state) => {
            state.isLoading = false;
          });
          return { success: false, error: result.error ?? 'Login failed' };
        } catch (error) {
          logger.error(TAG, 'Login failed', error);
          set((state) => {
            state.isLoading = false;
          });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      register: async (email, password, displayName) => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          const authService = getAuthService();
          const result = await authService.register(email, password, displayName);

          if (result.success && result.user) {
            set((state) => {
              state.user = result.user!;
              state.isAuthenticated = true;
              state.isLoading = false;
            });
            return { success: true };
          }

          set((state) => {
            state.isLoading = false;
          });
          return { success: false, error: result.error ?? 'Registration failed' };
        } catch (error) {
          logger.error(TAG, 'Registration failed', error);
          set((state) => {
            state.isLoading = false;
          });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      logout: async () => {
        const userId = get().user?.uid;
        try {
          const authService = getAuthService();
          await authService.logout(userId ?? '');
        } catch (error) {
          logger.error(TAG, 'Logout cleanup failed', error);
        } finally {
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isLocked = false;
            state.lastActiveAt = null;
          });
        }
      },
    })),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        securitySettings: state.securitySettings,
        lastActiveAt: state.lastActiveAt,
      }),
    },
  ),
);
