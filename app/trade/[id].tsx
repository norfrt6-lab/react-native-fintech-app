import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import { Button, Input, Card, Divider } from '@/src/ui/components/common';

const TradeConfirmation = lazy(() =>
  import('@/src/ui/components/trade').then((m) => ({ default: m.TradeConfirmation }))
);
const TradeSuccess = lazy(() =>
  import('@/src/ui/components/trade').then((m) => ({ default: m.TradeSuccess }))
);
import { useTradeStore, usePortfolioStore, useMarketStore, useSettingsStore, useConnectivityStore } from '@/src/store';
import { validateTrade, executeTrade, calculateTradePreview } from '@/src/core/trade';
import { scheduleTradeNotification } from '@/src/core/notification';
import { formatCurrency, formatQuantity } from '@/src/lib/formatters';
import { TRADE } from '@/src/lib/constants';
import { getAnalytics } from '@/src/lib/analytics';
import { syncQueue } from '@/src/core/sync';
import type { OrderSide, OrderType } from '@/src/types';

const ORDER_TYPES: OrderType[] = ['market', 'limit', 'stop'];
const QUICK_AMOUNTS = [25, 50, 100, 250, 500];

export default function TradeModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { formData, setFormData, resetForm } = useTradeStore();
  const { balance, setBalance, addHolding, holdings } = usePortfolioStore();
  const { coins, isDataStale } = useMarketStore();
  const isConnected = useConnectivityStore((s) => s.status === 'online');

  const [activeSide, setActiveSide] = useState<OrderSide>('buy');
  const [activeOrderType, setActiveOrderType] = useState<OrderType>('market');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastTrade, setLastTrade] = useState<{
    side: OrderSide;
    symbol: string;
    quantity: number;
    totalAmount: number;
    price: number;
  } | null>(null);

  useEffect(() => {
    if (id) {
      setFormData({ coinId: id });
    }
  }, [id, setFormData]);

  const selectedCoin = useMemo(
    () => coins.find((c) => c.id === id) ?? coins.find((c) => c.id === formData.coinId),
    [coins, id, formData.coinId],
  );

  const amount = parseFloat(formData.amount) || 0;
  const preview = selectedCoin
    ? calculateTradePreview(amount, selectedCoin.currentPrice, activeSide)
    : { fee: 0, total: 0, quantity: 0 };

  const currentHolding = holdings.find((h) => h.coinId === (id ?? formData.coinId));
  const maxSellValue = currentHolding
    ? currentHolding.quantity * (selectedCoin?.currentPrice ?? 0)
    : 0;

  const availableForTrade = activeSide === 'buy' ? balance : maxSellValue;

  const handleQuickAmount = (quickAmount: number) => {
    Haptics.selectionAsync();
    setFormData({ amount: quickAmount.toString() });
  };

  const handleMaxAmount = () => {
    Haptics.selectionAsync();
    const maxAmount = activeSide === 'buy'
      ? Math.floor((balance / (1 + TRADE.FEE_PERCENTAGE / 100)) * 100) / 100
      : Math.floor(maxSellValue * 100) / 100;
    setFormData({ amount: maxAmount.toString() });
  };

  const handleTradePress = () => {
    if (!selectedCoin) return;

    if (!isConnected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('trade.noConnection'), t('trade.noConnectionMessage'));
      return;
    }

    if (isDataStale()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        t('trade.stalePriceData'),
        t('trade.stalePriceMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('trade.tradeAnyway'), onPress: () => proceedWithTrade() },
        ],
      );
      return;
    }

    proceedWithTrade();
  };

  const proceedWithTrade = () => {
    if (!selectedCoin) return;

    const error = validateTrade({
      coinId: selectedCoin.id,
      symbol: selectedCoin.symbol,
      name: selectedCoin.name,
      image: selectedCoin.image,
      side: activeSide,
      type: activeOrderType,
      amountUsd: amount,
      currentPrice: selectedCoin.currentPrice,
      limitPrice: formData.limitPrice ? parseFloat(formData.limitPrice) : undefined,
      stopPrice: formData.stopPrice ? parseFloat(formData.stopPrice) : undefined,
      availableBalance: availableForTrade,
    });

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('trade.tradeError'), error);
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmTrade = async () => {
    if (!selectedCoin) return;

    setIsExecuting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = await executeTrade({
      coinId: selectedCoin.id,
      symbol: selectedCoin.symbol,
      name: selectedCoin.name,
      image: selectedCoin.image,
      side: activeSide,
      type: activeOrderType,
      amountUsd: amount,
      currentPrice: selectedCoin.currentPrice,
      limitPrice: formData.limitPrice ? parseFloat(formData.limitPrice) : undefined,
      stopPrice: formData.stopPrice ? parseFloat(formData.stopPrice) : undefined,
      availableBalance: availableForTrade,
    });

    if (!result.success || !result.order || !result.transaction) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      getAnalytics().track({
        name: 'trade_failed',
        properties: { side: activeSide, symbol: selectedCoin.symbol, error: result.error ?? 'Unknown' },
      });
      Alert.alert(t('trade.tradeFailed'), result.error ?? t('common.error'));
      setIsExecuting(false);
      setShowConfirmation(false);
      return;
    }

    const { order, transaction } = result;

    useTradeStore.getState().addTransaction(transaction);

    if (activeSide === 'buy') {
      setBalance(balance - order.totalAmount);
      addHolding({
        id: `holding_${order.coinId}`,
        coinId: order.coinId,
        symbol: selectedCoin.symbol,
        name: selectedCoin.name,
        image: selectedCoin.image,
        quantity: order.quantity,
        averageBuyPrice: order.price,
        currentPrice: order.price,
        priceChangePercentage24h: selectedCoin.priceChangePercentage24h,
      });
    } else {
      setBalance(balance + order.totalAmount);
      usePortfolioStore.getState().reduceHolding(order.coinId, order.quantity);
    }

    setLastTrade({
      side: activeSide,
      symbol: selectedCoin.symbol,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      price: order.price,
    });

    const notificationsEnabled = useSettingsStore.getState().notificationsEnabled;
    if (notificationsEnabled) {
      scheduleTradeNotification(
        activeSide,
        selectedCoin.name,
        formatQuantity(order.quantity),
        formatCurrency(order.totalAmount),
      );
    }

    getAnalytics().track({
      name: 'trade_executed',
      properties: { side: activeSide, symbol: selectedCoin.symbol, amount: order.totalAmount },
    });

    syncQueue.enqueue({
      type: 'trade',
      payload: {
        orderId: order.id,
        transactionId: transaction.id,
        side: activeSide,
        coinId: selectedCoin.id,
        quantity: order.quantity,
        price: order.price,
        totalAmount: order.totalAmount,
      },
    });

    setIsExecuting(false);
    setShowConfirmation(false);
    setShowSuccess(true);
    resetForm();
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    setLastTrade(null);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.closeText, { color: colors.primary }]}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {selectedCoin ? selectedCoin.name : t('tabs.trade')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sideToggle}>
          {(['buy', 'sell'] as OrderSide[]).map((side) => (
            <TouchableOpacity
              key={side}
              onPress={() => { Haptics.selectionAsync(); setActiveSide(side); }}
              style={[
                styles.sideButton,
                {
                  backgroundColor: activeSide === side
                    ? side === 'buy' ? colors.success : colors.error
                    : colors.surface,
                  borderColor: activeSide === side ? 'transparent' : colors.border,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: activeSide === side }}
            >
              <Text style={[styles.sideText, { color: activeSide === side ? colors.textInverse : colors.text }]}>
                {t(`trade.${side}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.orderTypeRow}>
          {ORDER_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setActiveOrderType(type)}
              style={[
                styles.orderTypeButton,
                {
                  backgroundColor: activeOrderType === type ? colors.primary : 'transparent',
                  borderColor: activeOrderType === type ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: activeOrderType === type }}
            >
              <Text style={[styles.orderTypeText, { color: activeOrderType === type ? colors.textInverse : colors.textSecondary }]}>
                {t(`trade.${type}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.formCard}>
          {selectedCoin && (
            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <Image source={{ uri: selectedCoin.image }} style={styles.selectedCoinIcon} contentFit="cover" />
                <View>
                  <Text style={[styles.coinName, { color: colors.text }]}>{selectedCoin.name}</Text>
                  <Text style={[styles.coinSymbol, { color: colors.textSecondary }]}>{selectedCoin.symbol.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={[styles.currentPrice, { color: colors.text }]}>{formatCurrency(selectedCoin.currentPrice)}</Text>
            </View>
          )}

          <Divider />

          <Input
            label={`${t('trade.amount')} (USD)`}
            placeholder="0.00"
            value={formData.amount}
            onChangeText={(val) => setFormData({ amount: val })}
            keyboardType="decimal-pad"
            rightIcon={<Text style={[styles.maxButton, { color: colors.primary }]}>{t('trade.max')}</Text>}
            onRightIconPress={handleMaxAmount}
          />

          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((qa) => (
              <TouchableOpacity
                key={qa}
                onPress={() => handleQuickAmount(qa)}
                style={[styles.quickButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
              >
                <Text style={[styles.quickText, { color: colors.text }]}>${qa}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeOrderType === 'limit' && (
            <Input
              label={t('trade.price')}
              placeholder={selectedCoin ? formatCurrency(selectedCoin.currentPrice) : '0.00'}
              value={formData.limitPrice}
              onChangeText={(val) => setFormData({ limitPrice: val })}
              keyboardType="decimal-pad"
            />
          )}

          {activeOrderType === 'stop' && (
            <Input
              label={t('trade.stopPrice')}
              placeholder={selectedCoin ? formatCurrency(selectedCoin.currentPrice) : '0.00'}
              value={formData.stopPrice}
              onChangeText={(val) => setFormData({ stopPrice: val })}
              keyboardType="decimal-pad"
            />
          )}

          <View style={[styles.preview, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {activeSide === 'buy' ? t('trade.youReceive') : t('trade.youSell')}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatQuantity(preview.quantity)} {selectedCoin?.symbol.toUpperCase() ?? ''}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('trade.fee')} ({TRADE.FEE_PERCENTAGE}%)
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(preview.fee)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('trade.total')}</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(preview.total)}</Text>
            </View>
            <Divider marginVertical={spacing.sm} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('trade.available')}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(availableForTrade)}</Text>
            </View>
          </View>

          <Button
            title={`${t(`trade.${activeSide}`)} ${selectedCoin?.symbol.toUpperCase() ?? ''}`}
            onPress={handleTradePress}
            variant={activeSide === 'buy' ? 'primary' : 'danger'}
            size="lg"
            fullWidth
            disabled={amount <= 0 || !selectedCoin}
          />
        </Card>
      </ScrollView>

      {selectedCoin && (
        <Suspense fallback={<ActivityIndicator color={colors.primary} />}>
          <TradeConfirmation
            visible={showConfirmation}
            onConfirm={handleConfirmTrade}
            onCancel={() => setShowConfirmation(false)}
            coinName={selectedCoin.name}
            coinSymbol={selectedCoin.symbol}
            coinImage={selectedCoin.image}
            side={activeSide}
            type={activeOrderType}
            amount={amount}
            quantity={preview.quantity}
            price={selectedCoin.currentPrice}
            fee={preview.fee}
            total={preview.total}
            loading={isExecuting}
          />
        </Suspense>
      )}

      {lastTrade && (
        <Suspense fallback={<ActivityIndicator color={colors.primary} />}>
          <TradeSuccess
            visible={showSuccess}
            onDone={handleSuccessDone}
            side={lastTrade.side}
            coinSymbol={lastTrade.symbol}
            quantity={lastTrade.quantity}
            totalAmount={lastTrade.totalAmount}
            price={lastTrade.price}
          />
        </Suspense>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  closeText: { ...typography.label },
  headerTitle: { ...typography.h4 },
  placeholder: { width: 50 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxxl },
  sideToggle: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  sideButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1.5 },
  sideText: { ...typography.button },
  orderTypeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  orderTypeButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center', borderWidth: 1 },
  orderTypeText: { ...typography.buttonSmall },
  formCard: { padding: spacing.xl },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  priceLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  selectedCoinIcon: { width: 36, height: 36, borderRadius: 18 },
  coinName: { ...typography.label },
  coinSymbol: { ...typography.caption },
  currentPrice: { ...typography.h4 },
  maxButton: { ...typography.caption, fontWeight: '700' },
  quickAmounts: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center', borderWidth: 1 },
  quickText: { ...typography.caption, fontWeight: '600' },
  preview: { padding: spacing.lg, borderRadius: borderRadius.md, marginBottom: spacing.xl, gap: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...typography.bodySmall },
  summaryValue: { ...typography.bodySmall, fontWeight: '500' },
  totalValue: { ...typography.label, fontWeight: '700' },
});
