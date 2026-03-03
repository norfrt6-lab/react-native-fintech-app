import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography } from '@/src/ui/theme';
import { Input, ScreenErrorBoundary, MarketsSkeleton, StaleBanner, ErrorBanner } from '@/src/ui/components/common';
import { CoinListItem } from '@/src/ui/components/market';
import { useMarketStore } from '@/src/store';
import type { CoinMarketData } from '@/src/types';

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

  const filteredCoins = searchQuery
    ? coins.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : coins;

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
        {marketError && (
          <ErrorBanner message={marketError} onRetry={() => fetchMarketData(true)} onDismiss={clearError} />
        )}
        {!marketError && isDataStale() && (
          <StaleBanner lastUpdatedAt={getLastFetchedAt()} onRefresh={() => fetchMarketData(true)} />
        )}
      </View>

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
  listContent: {
    paddingBottom: spacing.xxxl,
  },
});
