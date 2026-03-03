import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { zustandStorage } from '../lib/storage';
import type { User, BiometricType, SecuritySettings } from '../types';

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
  logout: () => void;
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
    immer((set) => ({
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

      logout: () =>
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.isLocked = false;
          state.lastActiveAt = null;
        }),
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
