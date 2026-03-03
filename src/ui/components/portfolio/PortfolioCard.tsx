import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography, borderRadius, shadows } from '../../theme';
import { PriceChange } from '../common/PriceChange';
import { formatCurrency } from '../../../lib/formatters';

interface PortfolioCardProps {
  totalValue: number;
  dayChange: number;
  dayChangePercentage: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  hideBalance: boolean;
  onToggleHide: () => void;
}

export function PortfolioCard({
  totalValue,
  dayChange,
  dayChangePercentage,
  totalProfitLoss,
  totalProfitLossPercentage,
  hideBalance,
  onToggleHide,
}: PortfolioCardProps) {
  const { colors } = useTheme();

  const maskedValue = '****';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
        },
        shadows.lg,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.label}>Portfolio Value</Text>
        <TouchableOpacity onPress={onToggleHide} hitSlop={8}>
          <Text style={styles.eyeIcon}>{hideBalance ? '👁️‍🗨️' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.value}>
        {hideBalance ? maskedValue : formatCurrency(totalValue)}
      </Text>

      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Today</Text>
          <Text style={styles.statValue}>
            {hideBalance
              ? maskedValue
              : `${dayChange >= 0 ? '+' : ''}${formatCurrency(dayChange)}`}
          </Text>
          {!hideBalance && (
            <PriceChange value={dayChangePercentage} size="sm" />
          )}
        </View>

        <View style={[styles.stat, styles.statRight]}>
          <Text style={styles.statLabel}>Total P&L</Text>
          <Text style={styles.statValue}>
            {hideBalance
              ? maskedValue
              : `${totalProfitLoss >= 0 ? '+' : ''}${formatCurrency(totalProfitLoss)}`}
          </Text>
          {!hideBalance && (
            <PriceChange value={totalProfitLossPercentage} size="sm" />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
  },
  eyeIcon: {
    fontSize: 18,
  },
  value: {
    ...typography.monoLarge,
    color: '#FFFFFF',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
  },
  statRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.xxs,
  },
  statValue: {
    ...typography.label,
    color: '#FFFFFF',
    marginBottom: spacing.xxs,
  },
});
