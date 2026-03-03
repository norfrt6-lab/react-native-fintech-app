import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import { Button, Input, Card } from '@/src/ui/components/common';
import { useTradeStore, usePortfolioStore, useMarketStore } from '@/src/store';
import { formatCurrency } from '@/src/lib/formatters';
import { TRADE } from '@/src/lib/constants';
import type { OrderSide, OrderType } from '@/src/types';

const ORDER_TYPES: OrderType[] = ['market', 'limit', 'stop'];

export default function TradeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { formData, setFormData, resetForm, isSubmitting } = useTradeStore();
  const { balance } = usePortfolioStore();
  const { coins } = useMarketStore();

  const [activeSide, setActiveSide] = useState<OrderSide>('buy');
  const [activeOrderType, setActiveOrderType] = useState<OrderType>('market');

  const selectedCoin = coins.find((c) => c.id === formData.coinId) ?? coins[0];

  useEffect(() => {
    if (coins.length > 0 && !formData.coinId) {
      setFormData({ coinId: coins[0]?.id ?? '' });
    }
  }, [coins, formData.coinId, setFormData]);

  const amount = parseFloat(formData.amount) || 0;
  const fee = amount * (TRADE.FEE_PERCENTAGE / 100);
  const total = activeSide === 'buy' ? amount + fee : amount - fee;

  const handleTrade = () => {
    setFormData({ side: activeSide, type: activeOrderType });
    // Trade execution handled in Phase 5
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t('tabs.trade')}
        </Text>

        <View style={styles.sideToggle}>
          {(['buy', 'sell'] as OrderSide[]).map((side) => (
            <TouchableOpacity
              key={side}
              onPress={() => setActiveSide(side)}
              style={[
                styles.sideButton,
                {
                  backgroundColor:
                    activeSide === side
                      ? side === 'buy'
                        ? colors.success
                        : colors.error
                      : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sideText,
                  {
                    color:
                      activeSide === side ? colors.textInverse : colors.text,
                  },
                ]}
              >
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
                  backgroundColor:
                    activeOrderType === type ? colors.primary : 'transparent',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.orderTypeText,
                  {
                    color:
                      activeOrderType === type
                        ? colors.textInverse
                        : colors.textSecondary,
                  },
                ]}
              >
                {t(`trade.${type}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.formCard}>
          {selectedCoin && (
            <View style={styles.priceRow}>
              <Text style={[styles.coinName, { color: colors.text }]}>
                {selectedCoin.name} ({selectedCoin.symbol.toUpperCase()})
              </Text>
              <Text style={[styles.currentPrice, { color: colors.text }]}>
                {formatCurrency(selectedCoin.currentPrice)}
              </Text>
            </View>
          )}

          <Input
            label={`${t('trade.amount')} (USD)`}
            placeholder="0.00"
            value={formData.amount}
            onChangeText={(val) => setFormData({ amount: val })}
            keyboardType="decimal-pad"
          />

          {activeOrderType === 'limit' && (
            <Input
              label={t('trade.price')}
              placeholder="0.00"
              value={formData.limitPrice}
              onChangeText={(val) => setFormData({ limitPrice: val })}
              keyboardType="decimal-pad"
            />
          )}

          {activeOrderType === 'stop' && (
            <Input
              label="Stop Price"
              placeholder="0.00"
              value={formData.stopPrice}
              onChangeText={(val) => setFormData({ stopPrice: val })}
              keyboardType="decimal-pad"
            />
          )}

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('trade.fee')} ({TRADE.FEE_PERCENTAGE}%)
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatCurrency(fee)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('trade.total')}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text, fontWeight: '700' }]}>
                {formatCurrency(total)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('trade.available')}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatCurrency(balance)}
              </Text>
            </View>
          </View>

          <Button
            title={`${t(`trade.${activeSide}`)} ${selectedCoin?.symbol.toUpperCase() ?? ''}`}
            onPress={handleTrade}
            variant={activeSide === 'buy' ? 'primary' : 'danger'}
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={amount <= 0}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xl,
  },
  sideToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sideButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  sideText: {
    ...typography.button,
  },
  orderTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  orderTypeText: {
    ...typography.buttonSmall,
  },
  formCard: {
    padding: spacing.xl,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  coinName: {
    ...typography.label,
  },
  currentPrice: {
    ...typography.h4,
  },
  summary: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...typography.bodySmall,
  },
  summaryValue: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
});
