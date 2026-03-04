import {
  registerForPushNotifications,
  getDevicePushToken,
} from '../../src/core/notification/notification-service';

const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockGetExpoPushToken = jest.fn();
const mockGetDevicePushToken = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: () => mockGetPermissions(),
  requestPermissionsAsync: () => mockRequestPermissions(),
  getExpoPushTokenAsync: (opts: unknown) => mockGetExpoPushToken(opts),
  getDevicePushTokenAsync: () => mockGetDevicePushToken(),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  setNotificationChannelAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('../../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('registerForPushNotifications', () => {
  it('returns push token when permission granted', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushToken.mockResolvedValue({ data: 'ExponentPushToken[abc123]' });

    const token = await registerForPushNotifications();

    expect(token).toBe('ExponentPushToken[abc123]');
    expect(mockGetExpoPushToken).toHaveBeenCalledWith({
      projectId: 'fintrack-portfolio-app',
    });
  });

  it('returns null when permission denied', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'denied' });
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });

    const token = await registerForPushNotifications();

    expect(token).toBeNull();
    expect(mockGetExpoPushToken).not.toHaveBeenCalled();
  });

  it('returns null on error', async () => {
    mockGetPermissions.mockRejectedValue(new Error('Device error'));

    const token = await registerForPushNotifications();

    expect(token).toBeNull();
  });
});

describe('getDevicePushToken', () => {
  it('returns device token on success', async () => {
    mockGetDevicePushToken.mockResolvedValue({ type: 'ios', data: 'device-token-123' });

    const token = await getDevicePushToken();

    expect(token).toBe('device-token-123');
  });

  it('returns null on error', async () => {
    mockGetDevicePushToken.mockRejectedValue(new Error('Not available'));

    const token = await getDevicePushToken();

    expect(token).toBeNull();
  });
});
