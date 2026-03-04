import React, { Component, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { spacing, typography, borderRadius } from '../../theme';
import { lightColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { getCrashReporter } from '../../../lib/crash-reporter';

interface ThemeColors {
  error: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  primary: string;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
  retryLabel?: string;
  colors?: ThemeColors;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    getCrashReporter().captureException(error, {
      componentStack: errorInfo.componentStack,
    });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const c = this.props.colors ?? lightColors;

      return (
        <View style={styles.container}>
          <Text style={[styles.icon, { color: c.error, borderColor: c.error }]}>!</Text>
          <Text style={[styles.title, { color: c.text }]}>Something went wrong</Text>
          <Text style={[styles.message, { color: c.textSecondary }]}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            style={[styles.retryButton, { backgroundColor: c.primary }]}
            accessibilityRole="button"
            accessibilityLabel={this.props.retryLabel ?? 'Try Again'}
          >
            <Text style={[styles.retryText, { color: c.textInverse }]}>
              {this.props.retryLabel ?? 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Theme-aware wrapper around AppErrorBoundary.
 * Use this in screens where you want the error UI to match the active theme.
 */
export function ScreenErrorBoundary({
  children,
  onRetry,
  retryLabel,
}: {
  children: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <AppErrorBoundary colors={colors} onRetry={onRetry} retryLabel={retryLabel}>
      {children}
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  icon: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    textAlign: 'center',
    lineHeight: 60,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  retryButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryText: {
    ...typography.button,
  },
});
