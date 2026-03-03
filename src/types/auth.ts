export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricEnabled: boolean;
  isPinEnabled: boolean;
  isLocked: boolean;
}

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface SecuritySettings {
  biometricEnabled: boolean;
  biometricType: BiometricType;
  pinEnabled: boolean;
  autoLockTimeout: number; // minutes
  screenshotPrevention: boolean;
  hideBalance: boolean;
}
