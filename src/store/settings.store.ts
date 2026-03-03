import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { zustandStorage } from '../lib/storage';

type ThemeMode = 'light' | 'dark' | 'system';
type CurrencyCode = 'usd' | 'eur' | 'gbp' | 'jpy' | 'btc' | 'eth';
type LanguageCode = 'en' | 'ja' | 'zh';

interface SettingsStore {
  theme: ThemeMode;
  currency: CurrencyCode;
  language: LanguageCode;
  notificationsEnabled: boolean;
  priceAlerts: boolean;
  hapticFeedback: boolean;
  biometricTradeConfirmation: boolean;

  setTheme: (theme: ThemeMode) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setLanguage: (language: LanguageCode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setPriceAlerts: (enabled: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setBiometricTradeConfirmation: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    immer((set) => ({
      theme: 'system' as ThemeMode,
      currency: 'usd' as CurrencyCode,
      language: 'en' as LanguageCode,
      notificationsEnabled: true,
      priceAlerts: true,
      hapticFeedback: true,
      biometricTradeConfirmation: true,

      setTheme: (theme) => set((state) => { state.theme = theme; }),
      setCurrency: (currency) => set((state) => { state.currency = currency; }),
      setLanguage: (language) => set((state) => { state.language = language; }),
      setNotificationsEnabled: (enabled) => set((state) => { state.notificationsEnabled = enabled; }),
      setPriceAlerts: (enabled) => set((state) => { state.priceAlerts = enabled; }),
      setHapticFeedback: (enabled) => set((state) => { state.hapticFeedback = enabled; }),
      setBiometricTradeConfirmation: (enabled) => set((state) => { state.biometricTradeConfirmation = enabled; }),
    })),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
