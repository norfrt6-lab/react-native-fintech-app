import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import { Input, EmptyState, ScreenErrorBoundary, MarketsSkeleton, StaleBanner, ErrorBanner } from '@/src/ui/components/common';
import { CoinListItem } from '@/src/ui/components/market';
import { useMarketStore } from '@/src/store';
import type { CoinMarketData, MarketSortBy } from '@/src/types';

const SORT_OPTIONS: { key: MarketSortBy; label: string }[] = [
  { key: 'market_cap', label: 'markets.marketCap' },
  { key: 'price', label: 'trade.price' },
  { key: 'price_change_24h', label: '24h %' },
  { key: 'volume', label: 'markets.volume' },
];

export default function MarketsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    coins,
    isLoading,
    isRefreshing,
    fetchMarketData,
    fetchMoreCoins,
    hasMore,
    isDataStale,
    getLastFetchedAt,
    error: marketError,
    clearError,
    filters,
    setFilters,
    watchlist,
  } = useMarketStore();

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const handleRefresh = useCallback(() => {
    fetchMarketData(true);
  }, [fetchMarketData]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading) {
      fetchMoreCoins();
    }
  }, [hasMore, isLoading, fetchMoreCoins]);

  const handleCoinPress = useCallback((coin: CoinMarketData) => {
    router.push(`/coin/${coin.id}` as never);
  }, [router]);

  const filteredCoins = useMemo(() => {
    let result = coins;

    if (filters.watchlistOnly) {
      result = result.filter((c) => watchlist.includes(c.id));
    }

    if (searchQuery) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    result = [...result].sort((a, b) => {
      let aVal: number, bVal: number;
      switch (filters.sortBy) {
        case 'price': aVal = a.currentPrice; bVal = b.currentPrice; break;
        case 'price_change_24h': aVal = a.priceChangePercentage24h; bVal = b.priceChangePercentage24h; break;
        case 'volume': aVal = a.totalVolume; bVal = b.totalVolume; break;
        default: aVal = a.marketCap; bVal = b.marketCap; break;
      }
      return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [coins, filters.watchlistOnly, filters.sortBy, filters.sortOrder, watchlist, searchQuery]);

  const renderItem = useCallback(
    ({ item }: { item: CoinMarketData }) => (
      <CoinListItem coin={item} onPress={handleCoinPress} showSparkline />
    ),
    [handleCoinPress],
  );

  if (isLoading && coins.length === 0) {
    return <MarketsSkeleton />;
  }

  return (
    <ScreenErrorBoundary>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('markets.title')}
        </Text>
        <Input
          placeholder={t('markets.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchContainer}
        />

        <View style={styles.filterRow}>
          {[
            { key: false, label: t('markets.all') },
            { key: true, label: t('markets.watchlist') },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={label}
              onPress={() => setFilters({ watchlistOnly: key })}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filters.watchlistOnly === key ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: filters.watchlistOnly === key }}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filters.watchlistOnly === key ? colors.textInverse : colors.text },
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
          {SORT_OPTIONS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => {
                if (filters.sortBy === key) {
                  setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
                } else {
                  setFilters({ sortBy: key, sortOrder: 'desc' });
                }
              }}
              style={[
                styles.sortChip,
                {
                  backgroundColor: filters.sortBy === key ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[
                styles.sortChipText,
                { color: filters.sortBy === key ? colors.textInverse : colors.text },
              ]}>
                {label.includes('.') ? t(label as never) : label}
                {filters.sortBy === key ? (filters.sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {marketError && (
          <ErrorBanner message={marketError} onRetry={() => fetchMarketData(true)} onDismiss={clearError} />
        )}
        {!marketError && isDataStale() && (
          <StaleBanner lastUpdatedAt={getLastFetchedAt()} onRefresh={() => fetchMarketData(true)} />
        )}
      </View>

      {filters.watchlistOnly && filteredCoins.length === 0 ? (
        <EmptyState
          title={t('markets.watchlist')}
          description="No coins in your watchlist yet"
        />
      ) : (
        <FlashList
          data={filteredCoins}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          accessibilityRole="list"
        />
      )}
    </View>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  searchContainer: {
    marginBottom: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  filterButtonText: {
    ...typography.buttonSmall,
  },
  sortRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  sortChipText: {
    ...typography.caption,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
});
