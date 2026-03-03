import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme';

export function DashboardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.padding}>
        <Skeleton width="40%" height={28} radius="sm" style={styles.gap} />
        <Skeleton width="100%" height={140} radius="lg" style={styles.gap} />
        <Skeleton width="100%" height={160} radius="md" style={styles.gapLg} />
        <Skeleton width="30%" height={20} radius="sm" style={styles.gap} />
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.holdingRow}>
            <Skeleton width={40} height={40} radius="full" />
            <View style={styles.holdingText}>
              <Skeleton width="60%" height={14} radius="sm" />
              <Skeleton width="40%" height={12} radius="sm" style={styles.gapSm} />
            </View>
            <View style={styles.holdingRight}>
              <Skeleton width={70} height={14} radius="sm" />
              <Skeleton width={50} height={12} radius="sm" style={styles.gapSm} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MarketsSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.padding}>
        <Skeleton width="35%" height={28} radius="sm" style={styles.gap} />
        <Skeleton width="100%" height={44} radius="md" style={styles.gapLg} />
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={styles.holdingRow}>
            <Skeleton width={36} height={36} radius="full" />
            <View style={styles.holdingText}>
              <Skeleton width="50%" height={14} radius="sm" />
              <Skeleton width="30%" height={12} radius="sm" style={styles.gapSm} />
            </View>
            <Skeleton width={80} height={32} radius="sm" />
            <View style={styles.holdingRight}>
              <Skeleton width={65} height={14} radius="sm" />
              <Skeleton width={45} height={12} radius="sm" style={styles.gapSm} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function CoinDetailSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.padding}>
        <View style={styles.coinHeader}>
          <Skeleton width={48} height={48} radius="full" />
          <View style={styles.holdingText}>
            <Skeleton width="40%" height={22} radius="sm" />
            <Skeleton width="25%" height={14} radius="sm" style={styles.gapSm} />
          </View>
        </View>
        <Skeleton width="50%" height={32} radius="sm" style={styles.gap} />
        <Skeleton width="30%" height={16} radius="sm" style={styles.gap} />
        <Skeleton width="100%" height={200} radius="md" style={styles.gapLg} />
        <View style={styles.timeRangeRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width={40} height={28} radius="sm" />
          ))}
        </View>
        <Skeleton width="100%" height={120} radius="md" style={styles.gapLg} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padding: {
    padding: spacing.lg,
  },
  gap: {
    marginBottom: spacing.md,
  },
  gapSm: {
    marginTop: spacing.xs,
  },
  gapLg: {
    marginBottom: spacing.xl,
  },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  holdingText: {
    flex: 1,
  },
  holdingRight: {
    alignItems: 'flex-end',
  },
  coinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  timeRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
});
