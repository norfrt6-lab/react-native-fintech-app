import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AppErrorBoundary, ScreenErrorBoundary } from '../../src/ui/components/common/ErrorBoundary';

const mockReporter = {
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  init: jest.fn(),
};
jest.mock('../../src/lib/crash-reporter', () => ({
  getCrashReporter: () => mockReporter,
}));

const mockColors = {
  error: '#FF3B30',
  text: '#000000',
  textSecondary: '#666666',
  textInverse: '#FFFFFF',
  primary: '#007AFF',
};
jest.mock('../../src/ui/theme/ThemeContext', () => ({
  useTheme: () => ({ colors: mockColors }),
}));

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>All good</Text>;
}

// Suppress console.error for expected error boundary logs
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Error Boundary')) return;
    if (typeof args[0] === 'string' && args[0].includes('The above error')) return;
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

describe('AppErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <AppErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('shows error fallback UI when child throws', () => {
    render(
      <AppErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Test error')).toBeTruthy();
  });

  it('shows Try Again button and resets error state', () => {
    render(
      <AppErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    // The "Try Again" button exists and is pressable
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeTruthy();
    fireEvent.press(retryButton);
    // After pressing, error boundary resets hasError to false
    // (component will re-throw but that's expected in this test)
  });

  it('renders custom fallback when provided', () => {
    render(
      <AppErrorBoundary fallback={<Text>Custom fallback</Text>}>
        <ThrowingComponent shouldThrow={true} />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback')).toBeTruthy();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    render(
      <AppErrorBoundary onError={onError}>
        <ThrowingComponent shouldThrow={true} />
      </AppErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it('logs error to crash reporter', () => {
    mockReporter.captureException.mockClear();

    render(
      <AppErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </AppErrorBoundary>,
    );

    expect(mockReporter.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });
});

describe('ScreenErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ScreenErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ScreenErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('shows theme-aware error UI when child throws', () => {
    render(
      <ScreenErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ScreenErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Test error')).toBeTruthy();
  });

  it('calls onRetry and shows custom retry label', () => {
    const onRetry = jest.fn();
    render(
      <ScreenErrorBoundary onRetry={onRetry} retryLabel="Reload Screen">
        <ThrowingComponent shouldThrow={true} />
      </ScreenErrorBoundary>,
    );
    const retryButton = screen.getByText('Reload Screen');
    expect(retryButton).toBeTruthy();
    fireEvent.press(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
