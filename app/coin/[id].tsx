import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import { Button, Card, PriceChange, AppErrorBoundary, CoinDetailSkeleton } from '@/src/ui/components/common';
import { TimeRangeSelector, PriceAlertSheet } from '@/src/ui/components/market';
import { LineChart } from '@/src/ui/components/charts';
import { useMarketStore, useNotificationStore } from '@/src/store';
import { formatCurrency, formatNumber } from '@/src/lib/formatters';
import { getAlertsForCoin } from '@/src/core/notification';
import type { TimeRange } from '@/src/types';

export default function CoinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dimensions = useWindowDimensions();

  const [showAlertSheet, setShowAlertSheet] = useState(false);

  const {
    selectedCoin,
    priceHistory,
    selectedTimeRange,
    isLoading,
    fetchCoinDetail,
    fetchPriceHistory,
  } = useMarketStore();

  const alerts = useNotificationStore((s) => s.alerts);
  const activeAlertCount = selectedCoin
    ? getAlertsForCoin(alerts, selectedCoin.id).filter((a) => a.status === 'active').length
    : 0;

  useEffect(() => {
    if (id) {
      fetchCoinDetail(id);
      fetchPriceHistory(id, selectedTimeRange);
    }
  }, [id, fetchCoinDetail, fetchPriceHistory, selectedTimeRange]);

  const handleTimeRangeChange = (range: TimeRange) => {
    if (id) {
      fetchPriceHistory(id, range);
    }
  };

  if (isLoading && !selectedCoin) {
    return <CoinDetailSkeleton />;
  }

  if (!selectedCoin) return null;

  const stats = [
    { label: t('markets.marketCap'), value: formatCurrency(selectedCoin.marketCap, 'USD', true) },
    { label: t('markets.volume'), value: formatCurrency(selectedCoin.totalVolume, 'USD', true) },
    { label: t('markets.high24h'), value: formatCurrency(selectedCoin.high24h) },
    { label: t('markets.low24h'), value: formatCurrency(selectedCoin.low24h) },
    { label: t('markets.supply'), value: formatNumber(selectedCoin.circulatingSupply, true) },
    { label: t('markets.ath'), value: formatCurrency(selectedCoin.ath) },
  ];

  return (
    <AppErrorBoundary>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowAlertSheet(true)} style={styles.headerButton}>
            <Text style={{ fontSize: 20 }}>
              {activeAlertCount > 0 ? `🔔 ${activeAlertCount}` : '🔔'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => useMarketStore.getState().toggleWatchlist(selectedCoin.id)}
            style={styles.headerButton}
          >
            <Text style={{ fontSize: 22 }}>
              {useMarketStore.getState().isInWatchlist(selectedCoin.id) ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.coinHeader}>
          <Image
            source={{ uri: selectedCoin.image }}
            style={styles.coinIcon}
            contentFit="cover"
          />
          <View style={styles.coinInfo}>
            <Text style={[styles.coinName, { color: colors.text }]}>
              {selectedCoin.name}
            </Text>
            <Text style={[styles.coinSymbol, { color: colors.textSecondary }]}>
              {selectedCoin.symbol.toUpperCase()} • Rank #{selectedCoin.marketCapRank}
            </Text>
          </View>
        </View>

        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: colors.text }]}>
            {formatCurrency(selectedCoin.currentPrice)}
          </Text>
          <PriceChange
            value={selectedCoin.priceChangePercentage24h}
            showBadge
            size="md"
          />
        </View>

        <View style={styles.chartContainer}>
          {priceHistory.length > 1 ? (
            <LineChart
              data={priceHistory}
              width={dimensions.width - spacing.lg * 2}
              height={200}
              positive={selectedCoin.priceChangePercentage24h >= 0}
              showGradient
              strokeWidth={2.5}
            />
          ) : (
            <View style={[styles.chartPlaceholder, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[styles.chartText, { color: colors.textTertiary }]}>Loading chart...</Text>
            </View>
          )}
        </View>

        <TimeRangeSelector
          selected={selectedTimeRange}
          onSelect={handleTimeRangeChange}
        />

        <Card style={styles.statsCard}>
          {stats.map((stat, index) => (
            <View
              key={stat.label}
              style={[
                styles.statRow,
                index < stats.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.divider,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
            </View>
          ))}
        </Card>

        {selectedCoin.description ? (
          <Card style={styles.descriptionCard}>
            <Text style={[styles.descriptionTitle, { color: colors.text }]}>
              About {selectedCoin.name}
            </Text>
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={6}
            >
              {selectedCoin.description.replace(/<[^>]*>/g, '')}
            </Text>
          </Card>
        ) : null}

        <View style={styles.tradeActions}>
          <Button
            title={`${t('trade.buy')} ${selectedCoin.symbol.toUpperCase()}`}
            onPress={() => router.push(`/trade/${selectedCoin.id}` as never)}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
      <Modal
        visible={showAlertSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAlertSheet(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAlertSheet(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <PriceAlertSheet
              coin={selectedCoin}
              onClose={() => setShowAlertSheet(false)}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  backText: {
    ...typography.label,
  },
  scrollContent: {
    paddingBottom: spacing.xxxxl,
  },
  coinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
  },
  coinInfo: {
    marginLeft: spacing.md,
  },
  coinName: {
    ...typography.h3,
  },
  coinSymbol: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  price: {
    ...typography.monoLarge,
  },
  chartContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  chartPlaceholder: {
    height: 200,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartText: {
    ...typography.bodySmall,
  },
  statsCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  statLabel: {
    ...typography.bodySmall,
  },
  statValue: {
    ...typography.label,
  },
  descriptionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  descriptionTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodySmall,
    lineHeight: 22,
  },
  tradeActions: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerButton: {
    padding: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
