import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography, borderRadius } from '../../theme';
import { Button } from '../common';
import { formatCurrency, formatQuantity } from '../../../lib/formatters';
import type { OrderSide } from '../../../types';

interface TradeSuccessProps {
  visible: boolean;
  onDone: () => void;
  side: OrderSide;
  coinSymbol: string;
  quantity: number;
  totalAmount: number;
  price: number;
}

export function TradeSuccess({
  visible,
  onDone,
  side,
  coinSymbol,
  quantity,
  totalAmount,
  price,
}: TradeSuccessProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      opacity.value = withDelay(200, withSpring(1));
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible, scale, opacity]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const detailsStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          <Animated.View style={[styles.checkCircle, { backgroundColor: colors.successLight }, checkStyle]}>
            <Text style={styles.checkMark}>✓</Text>
          </Animated.View>

          <Animated.View style={detailsStyle}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('trade.tradeSuccess')}
            </Text>

            <Text style={[styles.summary, { color: colors.textSecondary }]}>
              {side === 'buy' ? 'Bought' : 'Sold'}{' '}
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {formatQuantity(quantity)} {coinSymbol.toUpperCase()}
              </Text>
              {'\n'}at{' '}
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {formatCurrency(price)}
              </Text>
            </Text>

            <View style={[styles.totalRow, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                {formatCurrency(totalAmount)}
              </Text>
            </View>

            <Button
              title={t('common.done')}
              onPress={onDone}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.doneButton}
            />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  content: {
    width: '100%',
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  checkMark: {
    fontSize: 40,
    color: '#00C853',
    fontWeight: '700',
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  summary: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xl,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    width: '100%',
    marginBottom: spacing.xl,
  },
  totalLabel: {
    ...typography.label,
  },
  totalValue: {
    ...typography.h4,
  },
  doneButton: {
    marginTop: spacing.sm,
  },
});
