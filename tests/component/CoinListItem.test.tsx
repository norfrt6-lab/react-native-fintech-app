import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { CoinListItem } from '../../src/ui/components/market/CoinListItem';
import { AppThemeProvider } from '../../src/ui/theme/ThemeContext';
import type { CoinMarketData } from '../../src/types';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: Record<string, unknown>) => <View testID="coin-image" {...props} />,
  };
});

jest.mock('../../src/ui/components/charts', () => {
  const { View } = require('react-native');
  return {
    SparklineChart: () => <View testID="sparkline" />,
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<AppThemeProvider forcedTheme="light">{ui}</AppThemeProvider>);
}

const mockCoin: CoinMarketData = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'https://example.com/btc.png',
  currentPrice: 50000,
  marketCap: 1000000000000,
  marketCapRank: 1,
  totalVolume: 30000000000,
  high24h: 51000,
  low24h: 49000,
  priceChange24h: 1000,
  priceChangePercentage24h: 2.04,
  priceChangePercentage7d: 5.0,
  circulatingSupply: 19000000,
  totalSupply: 21000000,
  maxSupply: 21000000,
  ath: 69000,
  athChangePercentage: -27.5,
  athDate: '2021-11-10',
  lastUpdated: '2025-01-01T00:00:00.000Z',
  sparklineIn7d: { price: [49000, 49500, 50000] },
};

describe('CoinListItem', () => {
  const onPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders coin name', () => {
    renderWithTheme(<CoinListItem coin={mockCoin} onPress={onPress} />);
    expect(screen.getByText('Bitcoin')).toBeTruthy();
  });

  it('renders coin symbol in uppercase', () => {
    renderWithTheme(<CoinListItem coin={mockCoin} onPress={onPress} />);
    expect(screen.getByText('BTC')).toBeTruthy();
  });

  it('renders formatted price', () => {
    renderWithTheme(<CoinListItem coin={mockCoin} onPress={onPress} />);
    expect(screen.getByText('$50,000.00')).toBeTruthy();
  });

  it('renders price change percentage', () => {
    renderWithTheme(<CoinListItem coin={mockCoin} onPress={onPress} />);
    expect(screen.getByText('+2.04%')).toBeTruthy();
  });

  it('calls onPress with coin data when tapped', () => {
    const { root } = renderWithTheme(<CoinListItem coin={mockCoin} onPress={onPress} />);
    const touchable = root.findByProps({ accessibilityRole: 'button' });
    fireEvent.press(touchable);
    expect(onPress).toHaveBeenCalledWith(mockCoin);
  });

  it('has accessibility label with coin info', () => {
    const { root } = renderWithTheme(<CoinListItem coin={mockCoin} onPress={onPress} />);
    const touchable = root.findByProps({ accessibilityRole: 'button' });
    expect(touchable.props.accessibilityLabel).toContain('Bitcoin');
    expect(touchable.props.accessibilityLabel).toContain('BTC');
  });

  it('has accessibility hint', () => {
    const { root } = renderWithTheme(<CoinListItem coin={mockCoin} onPress={onPress} />);
    const touchable = root.findByProps({ accessibilityRole: 'button' });
    expect(touchable.props.accessibilityHint).toBe('Opens coin details');
  });

  it('shows negative price change for declining coin', () => {
    const decliningCoin = { ...mockCoin, priceChangePercentage24h: -3.5 };
    renderWithTheme(<CoinListItem coin={decliningCoin} onPress={onPress} />);
    expect(screen.getByText('-3.50%')).toBeTruthy();
  });
});
