import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography } from '@/src/ui/theme';
import { PortfolioCard } from '@/src/ui/components/portfolio';
import { HoldingListItem } from '@/src/ui/components/portfolio';
import { PortfolioChart } from '@/src/ui/components/charts';
import { EmptyState } from '@/src/ui/components/common';
import { usePortfolioStore, useMarketStore } from '@/src/store';
import type { Holding } from '@/src/types';

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { width: screenWidth } = useWindowDimensions();

  const {
    holdings,
    summary,
    history,
    hideBalance,
    setHideBalance,
    updatePortfolioSummary,
  } = usePortfolioStore();

  const { fetchMarketData, isRefreshing } = useMarketStore();

  useEffect(() => {
    updatePortfolioSummary();
  }, [holdings, updatePortfolioSummary]);

  const handleRefresh = useCallback(async () => {
    await fetchMarketData(true);
    updatePortfolioSummary();
  }, [fetchMarketData, updatePortfolioSummary]);

  const handleHoldingPress = (holding: Holding) => {
    router.push(`/coin/${holding.coinId}` as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.greeting, { color: colors.text }]}>
          {t('tabs.dashboard')}
        </Text>

        <PortfolioCard
          totalValue={summary?.totalValue ?? 0}
          dayChange={summary?.dayChange ?? 0}
          dayChangePercentage={summary?.dayChangePercentage ?? 0}
          totalProfitLoss={summary?.totalProfitLoss ?? 0}
          totalProfitLossPercentage={summary?.totalProfitLossPercentage ?? 0}
          hideBalance={hideBalance}
          onToggleHide={() => setHideBalance(!hideBalance)}
        />

        {history.length >= 2 && (
          <View style={styles.chartContainer}>
            <PortfolioChart
              data={history}
              width={screenWidth - spacing.lg * 2}
              height={180}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('dashboard.holdings')}
          </Text>

          {holdings.length === 0 ? (
            <EmptyState
              title={t('dashboard.noHoldings')}
              description={t('dashboard.noHoldingsDesc')}
              actionLabel={t('dashboard.startTrading')}
              onAction={() => router.push('/(tabs)/markets')}
            />
          ) : (
            holdings.map((holding) => (
              <HoldingListItem
                key={holding.coinId}
                holding={holding}
                onPress={handleHoldingPress}
                hideBalance={hideBalance}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  greeting: {
    ...typography.h2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  chartContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h4,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
});
