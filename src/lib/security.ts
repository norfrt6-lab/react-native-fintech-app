import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { logger } from './logger';

const TAG = 'Security';

export interface SecurityCheckResult {
  isSecure: boolean;
  warnings: string[];
}

/**
 * Basic device integrity checks available in Expo managed workflow.
 */
export async function checkDeviceIntegrity(): Promise<SecurityCheckResult> {
  const warnings: string[] = [];

  if (!Device.isDevice) {
    warnings.push('Running on emulator/simulator');
  }

  if (Device.deviceType === Device.DeviceType.UNKNOWN) {
    warnings.push('Unknown device type');
  }

  if (Platform.OS === 'android') {
    const brand = Device.brand?.toLowerCase() ?? '';
    const modelName = Device.modelName?.toLowerCase() ?? '';
    if (brand === 'generic' || modelName.includes('sdk')) {
      warnings.push('Possible emulator detected');
    }
  }

  const isSecure = warnings.length === 0;
  if (!isSecure) {
    logger.warn(TAG, `Device integrity warnings: ${warnings.join(', ')}`);
  }

  return { isSecure, warnings };
}

/**
 * Detect if the app is running in a debugger in production.
 */
export function isDebuggerAttached(): boolean {
  if (__DEV__) return false;
  return (
    typeof (globalThis as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined'
  );
}

/**
 * Validate that response headers match expected values.
 */
export function validateResponseHeaders(
  headers: Record<string, string>,
  expectedHeaders: Record<string, string>,
): boolean {
  for (const [key, value] of Object.entries(expectedHeaders)) {
    if (headers[key] !== value) {
      logger.warn(TAG, `Unexpected response header: ${key}`);
      return false;
    }
  }
  return true;
}
