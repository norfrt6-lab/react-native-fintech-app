import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, typography } from '../../theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ text, variant = 'neutral', style }: BadgeProps) {
  const { colors } = useTheme();

  const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: colors.successLight, text: colors.success },
    warning: { bg: colors.warningLight, text: colors.warning },
    error: { bg: colors.errorLight, text: colors.error },
    info: { bg: colors.infoLight, text: colors.info },
    neutral: { bg: colors.backgroundSecondary, text: colors.textSecondary },
  };

  const { bg, text: textColor } = variantColors[variant];

  return (
    <View
      style={[styles.badge, { backgroundColor: bg }, style]}
      accessibilityRole="text"
      accessibilityLabel={text}
    >
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
