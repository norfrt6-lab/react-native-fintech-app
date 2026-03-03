import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography, borderRadius, shadows } from '../../theme';
import { Button, Divider } from '../common';
import { formatCurrency, formatQuantity } from '../../../lib/formatters';
import {
  authenticateWithBiometric,
  checkBiometricCapability,
  getBiometricLabel,
} from '../../../core/auth';
import { useSettingsStore, useAuthStore } from '../../../store';
import type { OrderSide, OrderType } from '../../../types';

interface TradeConfirmationProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  side: OrderSide;
  type: OrderType;
  amount: number;
  quantity: number;
  price: number;
  fee: number;
  total: number;
  loading: boolean;
}

export function TradeConfirmation({
  visible,
  onConfirm,
  onCancel,
  coinName,
  coinSymbol,
  coinImage,
  side,
  type,
  amount,
  quantity,
  price,
  fee,
  total,
  loading,
}: TradeConfirmationProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [authenticating, setAuthenticating] = useState(false);

  const biometricTradeEnabled = useSettingsStore((s) => s.biometricTradeConfirmation);
  const biometricEnabled = useAuthStore((s) => s.securitySettings.biometricEnabled);

  const handleConfirm = async () => {
    if (biometricTradeEnabled && biometricEnabled) {
      setAuthenticating(true);
      const capability = await checkBiometricCapability();

      if (capability.isAvailable) {
        const result = await authenticateWithBiometric(
          `Confirm ${side === 'buy' ? 'purchase' : 'sale'} of ${coinSymbol.toUpperCase()}`,
        );

        setAuthenticating(false);

        if (!result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Authentication Required', result.error ?? 'Biometric authentication failed');
          return;
        }
      } else {
        setAuthenticating(false);
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }, shadows.xl]}>
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t('trade.confirmTrade')}
          </Text>

          <View style={styles.coinRow}>
            <Image source={{ uri: coinImage }} style={styles.coinIcon} contentFit="cover" />
            <View>
              <Text style={[styles.coinName, { color: colors.text }]}>{coinName}</Text>
              <Text style={[styles.coinSymbol, { color: colors.textSecondary }]}>
                {coinSymbol.toUpperCase()}
              </Text>
            </View>
            <View style={[
              styles.sideBadge,
              { backgroundColor: side === 'buy' ? colors.successLight : colors.errorLight },
            ]}>
              <Text style={[
                styles.sideText,
                { color: side === 'buy' ? colors.success : colors.error },
              ]}>
                {t(`trade.${side}`).toUpperCase()}
              </Text>
            </View>
          </View>

          <Divider />

          <View style={styles.details}>
            <DetailRow label="Order Type" value={type.charAt(0).toUpperCase() + type.slice(1)} colors={colors} />
            <DetailRow label={t('trade.price')} value={formatCurrency(price)} colors={colors} />
            <DetailRow label={t('trade.amount')} value={formatCurrency(amount)} colors={colors} />
            <DetailRow label="Quantity" value={`${formatQuantity(quantity)} ${coinSymbol.toUpperCase()}`} colors={colors} />
            <DetailRow label={t('trade.fee')} value={formatCurrency(fee)} colors={colors} />
            <Divider marginVertical={spacing.sm} />
            <DetailRow
              label={t('trade.total')}
              value={formatCurrency(total)}
              bold
              colors={colors}
            />
          </View>

          <View style={styles.actions}>
            <Button
              title={`${t(`trade.${side}`)} ${coinSymbol.toUpperCase()}`}
              onPress={handleConfirm}
              variant={side === 'buy' ? 'primary' : 'danger'}
              size="lg"
              fullWidth
              loading={loading || authenticating}
            />
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({
  label,
  value,
  bold,
  colors,
}: {
  label: string;
  value: string;
  bold?: boolean;
  colors: { text: string; textSecondary: string };
}) {
  return (
    <View style={detailStyles.row}>
      <Text style={[detailStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text
        style={[
          detailStyles.value,
          { color: colors.text },
          bold && { fontWeight: '700', fontSize: 16 },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxxl,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
  },
  coinName: {
    ...typography.label,
  },
  coinSymbol: {
    ...typography.caption,
  },
  sideBadge: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  sideText: {
    ...typography.caption,
    fontWeight: '700',
  },
  details: {
    marginVertical: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.label,
  },
});

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.bodySmall,
  },
  value: {
    ...typography.label,
  },
});
