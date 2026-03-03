import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography, borderRadius } from '../../theme';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.banner, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
      <Text style={[styles.text, { color: colors.error }]} numberOfLines={2}>
        {message}
      </Text>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.actionText, { color: colors.error }]}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.caption,
    fontWeight: '500',
    flex: 1,
    marginRight: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
