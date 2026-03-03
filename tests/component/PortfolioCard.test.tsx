import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PortfolioCard } from '../../src/ui/components/portfolio/PortfolioCard';
import { AppThemeProvider } from '../../src/ui/theme/ThemeContext';

function renderWithTheme(ui: React.ReactElement) {
  return render(<AppThemeProvider forcedTheme="light">{ui}</AppThemeProvider>);
}

const defaultProps = {
  totalValue: 50000,
  dayChange: 1250,
  dayChangePercentage: 2.56,
  totalProfitLoss: 10000,
  totalProfitLossPercentage: 25,
  hideBalance: false,
  onToggleHide: jest.fn(),
};

describe('PortfolioCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders portfolio value', () => {
    renderWithTheme(<PortfolioCard {...defaultProps} />);
    expect(screen.getByText('$50,000.00')).toBeTruthy();
  });

  it('renders day change with positive sign', () => {
    renderWithTheme(<PortfolioCard {...defaultProps} />);
    expect(screen.getByText('+$1,250.00')).toBeTruthy();
  });

  it('renders total P&L', () => {
    renderWithTheme(<PortfolioCard {...defaultProps} />);
    expect(screen.getByText('+$10,000.00')).toBeTruthy();
  });

  it('hides values when hideBalance is true', () => {
    renderWithTheme(<PortfolioCard {...defaultProps} hideBalance={true} />);
    // Portfolio value should be masked
    expect(screen.queryByText('$50,000.00')).toBeNull();
    // Masked values shown
    const maskedTexts = screen.getAllByText('****');
    expect(maskedTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onToggleHide when eye icon is pressed', () => {
    const onToggleHide = jest.fn();
    const { root } = renderWithTheme(<PortfolioCard {...defaultProps} onToggleHide={onToggleHide} />);

    const toggleButton = root.findByProps({ accessibilityRole: 'button' });
    fireEvent.press(toggleButton);
    expect(onToggleHide).toHaveBeenCalledTimes(1);
  });

  it('renders negative day change text', () => {
    renderWithTheme(
      <PortfolioCard {...defaultProps} dayChange={-500} dayChangePercentage={-1.02} />,
    );
    // formatCurrency(-500) uses 4 decimal places since -500 < 1
    expect(screen.getByText('-$500.0000')).toBeTruthy();
  });

  it('has summary accessibility role', () => {
    const { root } = renderWithTheme(<PortfolioCard {...defaultProps} />);
    const summary = root.findByProps({ accessibilityRole: 'summary' });
    expect(summary).toBeTruthy();
  });

  it('has descriptive accessibility label when visible', () => {
    const { root } = renderWithTheme(<PortfolioCard {...defaultProps} />);
    const summary = root.findByProps({ accessibilityRole: 'summary' });
    expect(summary.props.accessibilityLabel).toContain('$50,000.00');
  });
});
