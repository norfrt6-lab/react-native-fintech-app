// Fix for Expo SDK 55 import.meta registry
(globalThis as unknown as Record<string, unknown>).__ExpoImportMetaRegistry = new Map();

// Define __DEV__ for React Native
(globalThis as unknown as Record<string, unknown>).__DEV__ = true;

// Mock MMKV
const mockMMKVInstance = {
  getString: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  contains: jest.fn(),
  getAllKeys: jest.fn().mockReturnValue([]),
};
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn().mockImplementation(() => mockMMKVInstance),
  MMKV: jest.fn(),
}));

// Mock expo-crypto with incrementing values to ensure unique IDs
let mockCryptoCallCount = 0;
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn().mockImplementation((size: number) => {
    mockCryptoCallCount++;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = (mockCryptoCallCount * 17 + i * 13) % 256;
    }
    return Promise.resolve(bytes);
  }),
  digestStringAsync: jest.fn().mockResolvedValue('mocked-hash'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256', SHA512: 'SHA-512' },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1]),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn().mockReturnValue(jest.fn()),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
}));
