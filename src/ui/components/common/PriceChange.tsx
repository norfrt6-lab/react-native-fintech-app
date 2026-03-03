import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, typography } from '../../theme';
import { formatPercentage } from '../../../lib/formatters';

interface PriceChangeProps {
  value: number;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function PriceChange({
  value,
  showBadge = false,
  size = 'md',
  style,
}: PriceChangeProps) {
  const { colors } = useTheme();
  const isPositive = value >= 0;
  const color = isPositive ? colors.chartPositive : colors.chartNegative;
  const bgColor = isPositive ? colors.successLight : colors.errorLight;

  const textStyle =
    size === 'sm'
      ? typography.caption
      : size === 'lg'
        ? typography.body
        : typography.bodySmall;

  if (showBadge) {
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: bgColor },
          style,
        ]}
      >
        <Text style={[textStyle, { color, fontWeight: '600' }]}>
          {formatPercentage(value)}
        </Text>
      </View>
    );
  }

  return (
    <Text style={[textStyle, { color, fontWeight: '600' }, style]}>
      {formatPercentage(value)}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
});
