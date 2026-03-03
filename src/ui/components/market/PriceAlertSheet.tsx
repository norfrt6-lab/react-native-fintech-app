import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import { Button } from '@/src/ui/components/common';
import { useNotificationStore, useSettingsStore } from '@/src/store';
import { validateAlertPrice, getAlertsForCoin } from '@/src/core/notification';
import { formatCurrency } from '@/src/lib/formatters';
import type { CoinMarketData, AlertCondition } from '@/src/types';

interface PriceAlertSheetProps {
  coin: CoinMarketData;
  onClose: () => void;
}

export function PriceAlertSheet({ coin, onClose }: PriceAlertSheetProps) {
  const { colors } = useTheme();
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [priceText, setPriceText] = useState('');

  const addAlert = useNotificationStore((s) => s.addAlert);
  const removeAlert = useNotificationStore((s) => s.removeAlert);
  const alerts = useNotificationStore((s) => s.alerts);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);

  const coinAlerts = getAlertsForCoin(alerts, coin.id);
  const activeAlerts = coinAlerts.filter((a) => a.status === 'active');

  const handleCreate = () => {
    if (!notificationsEnabled) {
      Alert.alert('Notifications Disabled', 'Enable notifications in Settings to use price alerts.');
      return;
    }

    const targetPrice = parseFloat(priceText);
    if (isNaN(targetPrice)) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    const error = validateAlertPrice(condition, targetPrice, coin.currentPrice);
    if (error) {
      Alert.alert('Invalid Alert', error);
      return;
    }

    addAlert(coin, condition, targetPrice);
    setPriceText('');
    Alert.alert(
      'Alert Created',
      `You'll be notified when ${coin.symbol.toUpperCase()} goes ${condition} ${formatCurrency(targetPrice)}`,
    );
  };

  const handleRemove = (alertId: string) => {
    removeAlert(alertId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Price Alerts — {coin.symbol.toUpperCase()}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={[styles.closeText, { color: colors.primary }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.currentPrice, { color: colors.textSecondary }]}>
        Current: {formatCurrency(coin.currentPrice)}
      </Text>

      <View style={styles.conditionRow}>
        {(['above', 'below'] as AlertCondition[]).map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCondition(c)}
            style={[
              styles.conditionButton,
              {
                backgroundColor: condition === c ? colors.primary : colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.conditionText,
                { color: condition === c ? colors.textInverse : colors.text },
              ]}
            >
              {c === 'above' ? 'Above' : 'Below'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <Text style={[styles.dollarSign, { color: colors.textSecondary }]}>$</Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
          ]}
          value={priceText}
          onChangeText={setPriceText}
          placeholder="Target price"
          placeholderTextColor={colors.textTertiary}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
      </View>

      <Button
        title="Create Alert"
        onPress={handleCreate}
        variant="primary"
        size="md"
        fullWidth
        disabled={!priceText}
      />

      {activeAlerts.length > 0 && (
        <View style={styles.activeSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Active Alerts ({activeAlerts.length})
          </Text>
          {activeAlerts.map((alert) => (
            <View
              key={alert.id}
              style={[styles.alertRow, { borderBottomColor: colors.divider }]}
            >
              <View>
                <Text style={[styles.alertCondition, { color: colors.text }]}>
                  {alert.condition === 'above' ? 'Above' : 'Below'}{' '}
                  {formatCurrency(alert.targetPrice)}
                </Text>
                <Text style={[styles.alertMeta, { color: colors.textTertiary }]}>
                  Set at {formatCurrency(alert.priceAtCreation)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemove(alert.id)}>
                <Text style={[styles.removeText, { color: colors.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h4,
  },
  closeText: {
    ...typography.label,
  },
  currentPrice: {
    ...typography.bodySmall,
    marginBottom: spacing.lg,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  conditionText: {
    ...typography.buttonSmall,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dollarSign: {
    ...typography.h3,
  },
  input: {
    flex: 1,
    ...typography.body,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activeSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  alertCondition: {
    ...typography.body,
  },
  alertMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  removeText: {
    ...typography.buttonSmall,
  },
});
