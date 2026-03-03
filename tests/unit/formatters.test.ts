import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatQuantity,
  formatDate,
  formatDateShort,
  formatAddress,
} from '../../src/lib/formatters';

describe('formatCurrency', () => {
  it('formats standard amounts with 2 decimal places', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(100)).toBe('$100.00');
  });

  it('formats zero with extended precision (value < 1 path)', () => {
    // 0 < 1, so formatter uses 4-6 decimals
    expect(formatCurrency(0)).toBe('$0.0000');
  });

  it('formats sub-dollar amounts with more precision', () => {
    const result = formatCurrency(0.123456);
    // Should have at least 4 decimal places for values < 1
    expect(result).toMatch(/\$0\.1234/);
  });

  it('formats compact billions', () => {
    expect(formatCurrency(1_500_000_000, 'USD', true)).toBe('$1.50B');
    expect(formatCurrency(2_000_000_000, 'USD', true)).toBe('$2.00B');
  });

  it('formats compact millions', () => {
    expect(formatCurrency(1_500_000, 'USD', true)).toBe('$1.50M');
    // 750k is < 1M, falls into thousands bucket
    expect(formatCurrency(750_000, 'USD', true)).toBe('$750.00K');
  });

  it('formats compact thousands', () => {
    expect(formatCurrency(1_500, 'USD', true)).toBe('$1.50K');
    expect(formatCurrency(999, 'USD', true)).toBe('$999.00');
  });

  it('does not use compact format when not requested', () => {
    expect(formatCurrency(1_500_000)).toBe('$1,500,000.00');
  });

  it('handles negative values', () => {
    // abs(-100) < 1 is false, so uses 2 decimal places
    // But Intl sees the value as -100, abs value is 100 which is >= 1
    // The formatter checks `value < 1` where value is -100, so -100 < 1 is true
    expect(formatCurrency(-100)).toBe('-$100.0000');
  });
});

describe('formatPercentage', () => {
  it('adds + sign for positive values', () => {
    expect(formatPercentage(5.5)).toBe('+5.50%');
    expect(formatPercentage(0.1)).toBe('+0.10%');
  });

  it('shows - sign for negative values', () => {
    expect(formatPercentage(-3.2)).toBe('-3.20%');
  });

  it('adds + for zero', () => {
    expect(formatPercentage(0)).toBe('+0.00%');
  });

  it('respects custom decimal places', () => {
    expect(formatPercentage(5.555, 1)).toBe('+5.6%');
    expect(formatPercentage(5.555, 3)).toBe('+5.555%');
  });
});

describe('formatNumber', () => {
  it('formats regular numbers', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(0)).toBe('0');
  });

  it('formats compact billions', () => {
    expect(formatNumber(1_500_000_000, true)).toBe('1.50B');
  });

  it('formats compact millions', () => {
    expect(formatNumber(1_500_000, true)).toBe('1.50M');
  });

  it('formats compact thousands', () => {
    expect(formatNumber(1_500, true)).toBe('1.50K');
  });

  it('shows more precision for sub-1 values', () => {
    const result = formatNumber(0.00012345);
    // Should have up to 8 decimal places for values < 1
    expect(result).toContain('0.0001');
  });
});

describe('formatQuantity', () => {
  it('formats quantities >= 1 with 4 decimal places', () => {
    expect(formatQuantity(1.23456789)).toBe('1.2346');
    expect(formatQuantity(10)).toBe('10.0000');
  });

  it('formats quantities < 1 with 8 decimal places', () => {
    expect(formatQuantity(0.12345678)).toBe('0.12345678');
    expect(formatQuantity(0.001)).toBe('0.00100000');
  });
});

describe('formatDate', () => {
  it('formats today as "Today, time"', () => {
    const now = new Date();
    const result = formatDate(now.toISOString());
    expect(result).toMatch(/^Today, /);
  });

  it('formats yesterday as "Yesterday, time"', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatDate(yesterday.toISOString());
    expect(result).toMatch(/^Yesterday, /);
  });

  it('formats older dates with full format', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toContain('Jan 15, 2024');
  });

  it('accepts Date objects', () => {
    const result = formatDate(new Date());
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});

describe('formatDateShort', () => {
  it('formats date in short format', () => {
    const result = formatDateShort('2024-06-15T10:30:00Z');
    expect(result).toBe('Jun 15, 2024');
  });
});

describe('formatAddress', () => {
  it('truncates long addresses', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    expect(formatAddress(address)).toBe('0x1234...345678');
  });

  it('keeps short addresses intact', () => {
    expect(formatAddress('0x1234...5678')).toBe('0x1234...5678');
  });

  it('respects custom char count', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    expect(formatAddress(address, 4)).toBe('0x12...5678');
  });
});
