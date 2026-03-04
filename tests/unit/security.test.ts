jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  deviceType: 1, // PHONE
  DeviceType: { UNKNOWN: 0, PHONE: 1, TABLET: 2, DESKTOP: 3, TV: 4 },
  brand: 'Apple',
  modelName: 'iPhone 15',
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import { checkDeviceIntegrity, isDebuggerAttached, validateResponseHeaders } from '../../src/lib/security';

describe('Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDeviceIntegrity', () => {
    it('returns secure for physical device', async () => {
      const result = await checkDeviceIntegrity();
      expect(result.isSecure).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('warns when running on emulator', async () => {
      const Device = require('expo-device');
      const original = Device.isDevice;
      Device.isDevice = false;

      const result = await checkDeviceIntegrity();
      expect(result.isSecure).toBe(false);
      expect(result.warnings).toContain('Running on emulator/simulator');

      Device.isDevice = original;
    });

    it('warns for unknown device type', async () => {
      const Device = require('expo-device');
      const original = Device.deviceType;
      Device.deviceType = Device.DeviceType.UNKNOWN;

      const result = await checkDeviceIntegrity();
      expect(result.warnings).toContain('Unknown device type');

      Device.deviceType = original;
    });
  });

  describe('isDebuggerAttached', () => {
    it('returns false in dev mode', () => {
      (globalThis as Record<string, unknown>).__DEV__ = true;
      expect(isDebuggerAttached()).toBe(false);
    });

    it('detects React DevTools in production', () => {
      (globalThis as Record<string, unknown>).__DEV__ = false;
      (globalThis as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {};
      expect(isDebuggerAttached()).toBe(true);
      delete (globalThis as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      (globalThis as Record<string, unknown>).__DEV__ = true;
    });
  });

  describe('validateResponseHeaders', () => {
    it('returns true when headers match', () => {
      const result = validateResponseHeaders(
        { 'content-type': 'application/json' },
        { 'content-type': 'application/json' },
      );
      expect(result).toBe(true);
    });

    it('returns false when headers mismatch', () => {
      const result = validateResponseHeaders(
        { 'content-type': 'text/html' },
        { 'content-type': 'application/json' },
      );
      expect(result).toBe(false);
    });
  });
});
