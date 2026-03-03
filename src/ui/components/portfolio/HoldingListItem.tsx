import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, typography } from '../../theme';
import { PriceChange } from '../common/PriceChange';
import { formatCurrency, formatQuantity } from '../../../lib/formatters';
import type { Holding } from '../../../types';

interface HoldingListItemProps {
  holding: Holding;
  onPress: (holding: Holding) => void;
  hideBalance: boolean;
}

export const HoldingListItem = memo(function HoldingListItem({
  holding,
  onPress,
  hideBalance,
}: HoldingListItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => onPress(holding)}
      activeOpacity={0.6}
      style={[styles.container, { borderBottomColor: colors.divider }]}
      accessibilityRole="button"
      accessibilityLabel={`${holding.name}, ${formatQuantity(holding.quantity)} ${holding.symbol.toUpperCase()}, value ${formatCurrency(holding.value)}`}
      accessibilityHint="Opens coin details"
    >
      <View style={styles.left}>
        <Image
          source={{ uri: holding.image }}
          style={styles.icon}
          contentFit="cover"
        />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {holding.name}
          </Text>
          <Text style={[styles.quantity, { color: colors.textSecondary }]}>
            {hideBalance ? '***' : formatQuantity(holding.quantity)}{' '}
            {holding.symbol.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={[styles.value, { color: colors.text }]}>
          {hideBalance ? '****' : formatCurrency(holding.value)}
        </Text>
        <View style={styles.plRow}>
          <PriceChange value={holding.profitLossPercentage} size="sm" />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
  },
  info: {
    marginLeft: spacing.md,
    flex: 1,
  },
  name: {
    ...typography.label,
  },
  quantity: {
    ...typography.caption,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  value: {
    ...typography.label,
    marginBottom: 2,
  },
  plRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
