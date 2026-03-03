import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import { PortfolioCard } from '@/src/ui/components/portfolio';
import { HoldingListItem } from '@/src/ui/components/portfolio';
import { PortfolioChart } from '@/src/ui/components/charts';
import { EmptyState, AppErrorBoundary, DashboardSkeleton, FadeInView } from '@/src/ui/components/common';
import { usePortfolioStore, useMarketStore, useNotificationStore } from '@/src/store';
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

  const { fetchMarketData, isRefreshing, isLoading, coins } = useMarketStore();
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  useEffect(() => {
    updatePortfolioSummary();
  }, [holdings, updatePortfolioSummary]);

  const handleRefresh = useCallback(async () => {
    await fetchMarketData(true);
    updatePortfolioSummary();
  }, [fetchMarketData, updatePortfolioSummary]);

  const handleHoldingPress = useCallback((holding: Holding) => {
    router.push(`/coin/${holding.coinId}` as never);
  }, [router]);

  if (isLoading && coins.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <AppErrorBoundary>
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
        <View style={styles.dashboardHeader}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {t('tabs.dashboard')}
          </Text>
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.bellButton}
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? `${unreadCount} unread notifications, tap to mark all as read` : 'No unread notifications'}
          >
            <Text style={{ fontSize: 20 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

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
            holdings.map((holding, index) => (
              <FadeInView key={holding.coinId} delay={index * 60}>
                <HoldingListItem
                  holding={holding}
                  onPress={handleHoldingPress}
                  hideBalance={hideBalance}
                />
              </FadeInView>
            ))
          )}
        </View>
      </ScrollView>
    </View>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.h2,
  },
  bellButton: {
    position: 'relative',
    padding: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
