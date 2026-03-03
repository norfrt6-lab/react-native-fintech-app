import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import {
  checkBiometricCapability,
  authenticateWithBiometric,
  enrollBiometric,
  unenrollBiometric,
  isBiometricEnrolled,
  getBiometricLabel,
} from '../../src/core/auth/biometric';

jest.mock('../../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('checkBiometricCapability', () => {
  it('returns available with fingerprint type', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);

    const result = await checkBiometricCapability();
    expect(result.isAvailable).toBe(true);
    expect(result.biometricType).toBe('fingerprint');
  });

  it('returns available with facial recognition', async () => {
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);

    const result = await checkBiometricCapability();
    expect(result.biometricType).toBe('facial');
  });

  it('returns unavailable when no hardware', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

    const result = await checkBiometricCapability();
    expect(result.isAvailable).toBe(false);
    expect(result.biometricType).toBe('none');
  });

  it('returns unavailable when not enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

    const result = await checkBiometricCapability();
    expect(result.isAvailable).toBe(false);
  });

  it('handles errors gracefully', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(new Error('Device error'));

    const result = await checkBiometricCapability();
    expect(result.isAvailable).toBe(false);
    expect(result.biometricType).toBe('none');
  });
});

describe('authenticateWithBiometric', () => {
  beforeEach(() => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
  });

  it('returns success on successful authentication', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: true,
    });

    const result = await authenticateWithBiometric();
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns error on failed authentication', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: false,
      error: 'user_cancel',
    });

    const result = await authenticateWithBiometric();
    expect(result.success).toBe(false);
    expect(result.error).toBe('user_cancel');
  });

  it('passes custom prompt message', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

    await authenticateWithBiometric('Confirm trade');
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ promptMessage: 'Confirm trade' }),
    );
  });
});

describe('enrollBiometric', () => {
  beforeEach(() => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([1]);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it('enrolls successfully', async () => {
    const result = await enrollBiometric('user-123');
    expect(result).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
  });

  it('fails when biometric not available', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    const result = await enrollBiometric('user-123');
    expect(result).toBe(false);
  });

  it('fails when authentication fails', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: false });
    const result = await enrollBiometric('user-123');
    expect(result).toBe(false);
  });
});

describe('unenrollBiometric', () => {
  it('deletes stored enrollment data', async () => {
    await unenrollBiometric();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });
});

describe('isBiometricEnrolled', () => {
  it('returns true when enrolled', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('{"userId":"test"}');
    expect(await isBiometricEnrolled()).toBe(true);
  });

  it('returns false when not enrolled', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    expect(await isBiometricEnrolled()).toBe(false);
  });
});

describe('getBiometricLabel', () => {
  it('returns correct labels', () => {
    expect(getBiometricLabel('fingerprint')).toMatch(/Touch ID|Fingerprint/);
    expect(getBiometricLabel('facial')).toMatch(/Face ID|Face Recognition/);
    expect(getBiometricLabel('iris')).toBe('Iris');
    expect(getBiometricLabel('none')).toBe('Biometric');
  });
});
