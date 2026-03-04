import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { BiometricType } from '../../types';
import { logger } from '../../lib/logger';

const SECURE_KEYS = {
  BIOMETRIC_ENROLLED: 'fintrack_biometric_enrolled',
  SESSION_TOKEN: 'fintrack_session_token',
  PIN_HASH: 'fintrack_pin_hash',
} as const;

export interface BiometricCapability {
  isAvailable: boolean;
  biometricType: BiometricType;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export async function checkBiometricCapability(): Promise<BiometricCapability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { isAvailable: false, biometricType: 'none', supportedTypes: [] };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return { isAvailable: false, biometricType: 'none', supportedTypes: [] };
    }

    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const biometricType = mapBiometricType(supportedTypes);

    return { isAvailable: true, biometricType, supportedTypes };
  } catch (error) {
    logger.error('Biometric', 'Failed to check capability', error);
    return { isAvailable: false, biometricType: 'none', supportedTypes: [] };
  }
}

function mapBiometricType(
  types: LocalAuthentication.AuthenticationType[],
): BiometricType {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'facial';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  return 'none';
}

export function getBiometricLabel(type: BiometricType): string {
  switch (type) {
    case 'facial':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    case 'iris':
      return 'Iris';
    case 'none':
      return 'Biometric';
  }
}

export async function authenticateWithBiometric(
  promptMessage?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage ?? 'Authenticate to continue',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error ?? 'Authentication failed',
    };
  } catch (error) {
    logger.error('Biometric', 'Authentication error', error);
    return { success: false, error: 'Authentication error' };
  }
}

export async function enrollBiometric(userId: string): Promise<boolean> {
  try {
    const capability = await checkBiometricCapability();
    if (!capability.isAvailable) return false;

    const result = await authenticateWithBiometric(
      'Authenticate to enable biometric login',
    );

    if (result.success) {
      await SecureStore.setItemAsync(
        SECURE_KEYS.BIOMETRIC_ENROLLED,
        JSON.stringify({ userId, enrolledAt: Date.now() }),
      );
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Biometric', 'Enrollment failed', error);
    return false;
  }
}

export async function unenrollBiometric(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_KEYS.BIOMETRIC_ENROLLED);
    await SecureStore.deleteItemAsync(SECURE_KEYS.SESSION_TOKEN);
  } catch (error) {
    logger.error('Biometric', 'Unenroll failed', error);
  }
}

export async function isBiometricEnrolled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(SECURE_KEYS.BIOMETRIC_ENROLLED);
    return value !== null;
  } catch (error) {
    logger.debug('Biometric', 'Failed to read enrollment status from SecureStore', error);
    return false;
  }
}

export async function saveSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEYS.SESSION_TOKEN, token);
}

export async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SECURE_KEYS.SESSION_TOKEN);
  } catch (error) {
    logger.debug('Biometric', 'Failed to read session token from SecureStore', error);
    return null;
  }
}

export async function clearSessionToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_KEYS.SESSION_TOKEN);
  } catch (error) {
    logger.error('Biometric', 'Failed to clear session token', error);
    throw error;
  }
}
