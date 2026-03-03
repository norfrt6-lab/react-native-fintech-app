import React, { Component, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { spacing, typography, borderRadius } from '../../theme';
import { lightColors } from '../../theme/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
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
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.icon}>!</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity onPress={this.handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
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
    color: lightColors.error,
    marginBottom: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: lightColors.error,
    textAlign: 'center',
    lineHeight: 60,
  },
  title: {
    ...typography.h3,
    color: lightColors.text,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodySmall,
    color: lightColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  retryButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: lightColors.primary,
  },
  retryText: {
    ...typography.button,
    color: lightColors.textInverse,
  },
});
