// All imports done inside jest.isolateModules blocks below

const mockCrashReporter = {
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  startTransaction: jest.fn(),
  setTag: jest.fn(),
  recordMetric: jest.fn(),
};

jest.mock('../../src/lib/crash-reporter', () => ({
  getCrashReporter: () => mockCrashReporter,
}));

let mockEnableAnalytics = false;
jest.mock('../../src/lib/config', () => ({
  getConfig: () => ({
    enableAnalytics: mockEnableAnalytics,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the singleton by clearing the module cache
  jest.resetModules();
});

describe('AnalyticsService', () => {
  it('does not track events when disabled', () => {
    mockEnableAnalytics = false;
    // Re-require to get fresh instance
    const { getAnalytics: freshGetAnalytics, initAnalytics: freshInit } =
      jest.requireActual('../../src/lib/analytics') as typeof import('../../src/lib/analytics');
    freshInit();
    freshGetAnalytics().track({ name: 'screen_view', properties: { screen: '/home' } });
    expect(mockCrashReporter.addBreadcrumb).not.toHaveBeenCalled();
  });

  it('tracks events as breadcrumbs when enabled', () => {
    mockEnableAnalytics = true;
    const { getAnalytics: freshGetAnalytics, initAnalytics: freshInit } =
      jest.requireActual('../../src/lib/analytics') as typeof import('../../src/lib/analytics');
    freshInit();

    // Clear the session_start breadcrumb from init
    mockCrashReporter.addBreadcrumb.mockClear();

    freshGetAnalytics().track({
      name: 'trade_executed',
      properties: { side: 'buy', symbol: 'BTC', amount: 100 },
    });

    expect(mockCrashReporter.addBreadcrumb).toHaveBeenCalledWith({
      category: 'analytics',
      message: 'trade_executed',
      level: 'info',
      data: { side: 'buy', symbol: 'BTC', amount: 100 },
    });
  });

  it('records session_start on init when enabled', () => {
    mockEnableAnalytics = true;
    const { initAnalytics: freshInit } =
      jest.requireActual('../../src/lib/analytics') as typeof import('../../src/lib/analytics');
    freshInit();

    expect(mockCrashReporter.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'analytics',
        message: 'session_start',
      }),
    );
  });

  it('trackScreenView records screen_view event', () => {
    mockEnableAnalytics = true;
    const { getAnalytics: freshGetAnalytics, initAnalytics: freshInit } =
      jest.requireActual('../../src/lib/analytics') as typeof import('../../src/lib/analytics');
    freshInit();
    mockCrashReporter.addBreadcrumb.mockClear();

    freshGetAnalytics().trackScreenView('/markets');

    expect(mockCrashReporter.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'screen_view',
        data: { screen: '/markets' },
      }),
    );
  });

  it('endSession records session_end with duration', () => {
    mockEnableAnalytics = true;
    const { getAnalytics: freshGetAnalytics, initAnalytics: freshInit } =
      jest.requireActual('../../src/lib/analytics') as typeof import('../../src/lib/analytics');
    freshInit();
    mockCrashReporter.addBreadcrumb.mockClear();

    freshGetAnalytics().endSession();

    expect(mockCrashReporter.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'session_end',
        data: expect.objectContaining({ durationMs: expect.any(Number) }),
      }),
    );
  });

  it('isEnabled returns correct state', () => {
    mockEnableAnalytics = false;
    const { getAnalytics: freshGetAnalytics, initAnalytics: freshInit } =
      jest.requireActual('../../src/lib/analytics') as typeof import('../../src/lib/analytics');
    freshInit();
    expect(freshGetAnalytics().isEnabled()).toBe(false);
  });

  it('does not record session_end when not initialized', () => {
    mockEnableAnalytics = false;
    const { getAnalytics: freshGetAnalytics, initAnalytics: freshInit } =
      jest.requireActual('../../src/lib/analytics') as typeof import('../../src/lib/analytics');
    freshInit();
    mockCrashReporter.addBreadcrumb.mockClear();

    freshGetAnalytics().endSession();
    expect(mockCrashReporter.addBreadcrumb).not.toHaveBeenCalled();
  });
});
