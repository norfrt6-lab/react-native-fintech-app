import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import { Button, Input, Card, Divider } from '@/src/ui/components/common';
import { TradeConfirmation, TradeSuccess } from '@/src/ui/components/trade';
import { useTradeStore, usePortfolioStore, useMarketStore, useSettingsStore } from '@/src/store';
import { validateTrade, executeTrade, calculateTradePreview } from '@/src/core/trade';
import { scheduleTradeNotification } from '@/src/core/notification';
import { formatCurrency, formatQuantity } from '@/src/lib/formatters';
import { TRADE } from '@/src/lib/constants';
import type { OrderSide, OrderType } from '@/src/types';

const ORDER_TYPES: OrderType[] = ['market', 'limit', 'stop'];
const QUICK_AMOUNTS = [25, 50, 100, 250, 500];

export default function TradeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { formData, setFormData, resetForm } = useTradeStore();
  const { balance, setBalance, addHolding, holdings } = usePortfolioStore();
  const { coins } = useMarketStore();

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

  const selectedCoin = useMemo(
    () => coins.find((c) => c.id === formData.coinId) ?? coins[0],
    [coins, formData.coinId],
  );

  useEffect(() => {
    if (coins.length > 0 && !formData.coinId) {
      setFormData({ coinId: coins[0]?.id ?? '' });
    }
  }, [coins, formData.coinId, setFormData]);

  const amount = parseFloat(formData.amount) || 0;
  const preview = selectedCoin
    ? calculateTradePreview(amount, selectedCoin.currentPrice, activeSide)
    : { fee: 0, total: 0, quantity: 0 };

  const currentHolding = holdings.find((h) => h.coinId === formData.coinId);
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
      Alert.alert('Trade Error', error);
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmTrade = async () => {
    if (!selectedCoin) return;

    setIsExecuting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = executeTrade({
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
      Alert.alert('Trade Failed', result.error ?? 'Unknown error');
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
      const existing = holdings.find((h) => h.coinId === order.coinId);
      if (existing) {
        const remaining = existing.quantity - order.quantity;
        if (remaining <= 0.00000001) {
          usePortfolioStore.getState().removeHolding(order.coinId);
        }
      }
    }

    setLastTrade({
      side: activeSide,
      symbol: selectedCoin.symbol,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      price: order.price,
    });

    // Send trade notification
    const notificationsEnabled = useSettingsStore.getState().notificationsEnabled;
    if (notificationsEnabled) {
      scheduleTradeNotification(
        activeSide,
        selectedCoin.name,
        formatQuantity(order.quantity),
        formatCurrency(order.totalAmount),
      );
    }

    setIsExecuting(false);
    setShowConfirmation(false);
    setShowSuccess(true);
    resetForm();
    if (coins.length > 0) {
      setFormData({ coinId: coins[0]?.id ?? '' });
    }
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    setLastTrade(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t('tabs.trade')}
        </Text>

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
            >
              <Text style={[styles.orderTypeText, { color: activeOrderType === type ? colors.textInverse : colors.textSecondary }]}>
                {t(`trade.${type}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinSelector}>
          {coins.slice(0, 10).map((coin) => (
            <TouchableOpacity
              key={coin.id}
              onPress={() => { Haptics.selectionAsync(); setFormData({ coinId: coin.id }); }}
              style={[
                styles.coinChip,
                {
                  backgroundColor: formData.coinId === coin.id ? colors.primary : colors.surface,
                  borderColor: formData.coinId === coin.id ? colors.primary : colors.border,
                },
              ]}
            >
              <Image source={{ uri: coin.image }} style={styles.coinChipIcon} contentFit="cover" />
              <Text style={[styles.coinChipText, { color: formData.coinId === coin.id ? colors.textInverse : colors.text }]}>
                {coin.symbol.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
            rightIcon={<Text style={[styles.maxButton, { color: colors.primary }]}>MAX</Text>}
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
              label="Stop Price"
              placeholder={selectedCoin ? formatCurrency(selectedCoin.currentPrice) : '0.00'}
              value={formData.stopPrice}
              onChangeText={(val) => setFormData({ stopPrice: val })}
              keyboardType="decimal-pad"
            />
          )}

          <View style={[styles.preview, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                You {activeSide === 'buy' ? 'receive' : 'sell'}
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
      )}

      {lastTrade && (
        <TradeSuccess
          visible={showSuccess}
          onDone={handleSuccessDone}
          side={lastTrade.side}
          coinSymbol={lastTrade.symbol}
          quantity={lastTrade.quantity}
          totalAmount={lastTrade.totalAmount}
          price={lastTrade.price}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxxl },
  title: { ...typography.h2, marginBottom: spacing.xl },
  sideToggle: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  sideButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1.5 },
  sideText: { ...typography.button },
  orderTypeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  orderTypeButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center', borderWidth: 1 },
  orderTypeText: { ...typography.buttonSmall },
  coinSelector: { marginBottom: spacing.lg },
  coinChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, marginRight: spacing.sm, gap: spacing.xs },
  coinChipIcon: { width: 20, height: 20, borderRadius: 10 },
  coinChipText: { ...typography.caption, fontWeight: '600' },
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
