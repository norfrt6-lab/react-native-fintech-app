import {
  syncUserData,
  fetchUserData,
  syncPortfolio,
  fetchPortfolio,
  syncTrades,
  syncWatchlist,
  syncSettings,
  syncAlerts,
} from '../../src/core/data/user-data-service';

const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockDoc = jest.fn().mockReturnValue('mock-doc-ref');

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

jest.mock('../../src/lib/firestore', () => ({
  getFirestoreDb: () => 'mock-db',
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

describe('syncUserData', () => {
  it('writes data to Firestore with updatedAt timestamp', async () => {
    mockSetDoc.mockResolvedValue(undefined);

    const result = await syncUserData('user123', 'portfolio', { holdings: [] });

    expect(result).toBe(true);
    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'user123', 'data', 'portfolio');
    expect(mockSetDoc).toHaveBeenCalledWith('mock-doc-ref', expect.objectContaining({
      holdings: [],
      updatedAt: expect.any(Number),
    }));
  });

  it('returns false on Firestore error', async () => {
    mockSetDoc.mockRejectedValue(new Error('Network error'));

    const result = await syncUserData('user123', 'portfolio', { holdings: [] });

    expect(result).toBe(false);
  });
});

describe('fetchUserData', () => {
  it('returns data when document exists', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ holdings: [{ coinId: 'bitcoin' }], balance: 5000 }),
    });

    const result = await fetchUserData('user123', 'portfolio');

    expect(result).toEqual({ holdings: [{ coinId: 'bitcoin' }], balance: 5000 });
  });

  it('returns null when document does not exist', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const result = await fetchUserData('user123', 'portfolio');

    expect(result).toBeNull();
  });

  it('returns null on error', async () => {
    mockGetDoc.mockRejectedValue(new Error('Permission denied'));

    const result = await fetchUserData('user123', 'settings');

    expect(result).toBeNull();
  });
});

describe('domain-specific sync functions', () => {
  beforeEach(() => {
    mockSetDoc.mockResolvedValue(undefined);
  });

  it('syncPortfolio sends portfolio data', async () => {
    const result = await syncPortfolio('u1', { holdings: [], balance: 1000, history: [] });
    expect(result).toBe(true);
    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'u1', 'data', 'portfolio');
  });

  it('syncTrades sends trade data', async () => {
    const result = await syncTrades('u1', { transactions: [] });
    expect(result).toBe(true);
    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'u1', 'data', 'trades');
  });

  it('syncWatchlist sends watchlist data', async () => {
    const result = await syncWatchlist('u1', { items: ['bitcoin', 'ethereum'] });
    expect(result).toBe(true);
    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'u1', 'data', 'watchlist');
  });

  it('syncSettings sends settings data', async () => {
    const result = await syncSettings('u1', { theme: 'dark' });
    expect(result).toBe(true);
    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'u1', 'data', 'settings');
  });

  it('syncAlerts sends alert data', async () => {
    const result = await syncAlerts('u1', { items: [] });
    expect(result).toBe(true);
    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'u1', 'data', 'alerts');
  });
});

describe('fetchPortfolio', () => {
  it('fetches portfolio collection', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ holdings: [], balance: 10000 }),
    });

    const result = await fetchPortfolio('u1');
    expect(result).toEqual({ holdings: [], balance: 10000 });
    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'u1', 'data', 'portfolio');
  });
});
