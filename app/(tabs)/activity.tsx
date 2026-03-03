import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import { EmptyState, Badge, Divider } from '@/src/ui/components/common';
import { useTradeStore } from '@/src/store';
import { formatCurrency, formatDate, formatDateShort } from '@/src/lib/formatters';
import type { Transaction } from '@/src/types';

interface TransactionSection {
  title: string;
  data: Transaction[];
}

export default function ActivityScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { transactions } = useTradeStore();

  const sections = useMemo<TransactionSection[]>(() => {
    const grouped = new Map<string, Transaction[]>();

    transactions.forEach((txn) => {
      const dateKey = formatDateShort(txn.createdAt);
      const existing = grouped.get(dateKey) ?? [];
      existing.push(txn);
      grouped.set(dateKey, existing);
    });

    return Array.from(grouped.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [transactions]);

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'buy':
      case 'deposit':
        return colors.success;
      case 'sell':
      case 'withdraw':
        return colors.error;
      case 'fee':
        return colors.warning;
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={[styles.txnItem, { borderBottomColor: colors.divider }]}>
      <View style={styles.txnLeft}>
        <View style={styles.txnHeader}>
          <Text style={[styles.txnType, { color: getTypeColor(item.type) }]}>
            {item.type.toUpperCase()}
          </Text>
          <Badge
            text={item.status}
            variant={item.status === 'filled' ? 'success' : 'warning'}
          />
        </View>
        <Text style={[styles.txnCoin, { color: colors.text }]}>
          {item.symbol.toUpperCase()} - {item.name}
        </Text>
        <Text style={[styles.txnTime, { color: colors.textTertiary }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <View style={styles.txnRight}>
        <Text style={[styles.txnAmount, { color: colors.text }]}>
          {item.type === 'sell' || item.type === 'withdraw' ? '-' : '+'}
          {formatCurrency(item.totalAmount)}
        </Text>
        <Text style={[styles.txnQuantity, { color: colors.textSecondary }]}>
          {item.quantity.toFixed(6)} {item.symbol.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: TransactionSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {section.title}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('activity.title')}
        </Text>
        {transactions.length > 0 && (
          <TouchableOpacity>
            <Text style={[styles.exportText, { color: colors.primary }]}>
              {t('activity.export')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {transactions.length === 0 ? (
        <EmptyState
          title={t('activity.noTransactions')}
          description={t('activity.noTransactionsDesc')}
        />
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderTransaction}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled
        />
      )}
    </SafeAreaView>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  exportText: {
    ...typography.label,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txnLeft: {
    flex: 1,
  },
  txnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxs,
  },
  txnType: {
    ...typography.label,
    fontWeight: '700',
  },
  txnCoin: {
    ...typography.bodySmall,
    marginBottom: spacing.xxs,
  },
  txnTime: {
    ...typography.caption,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    ...typography.label,
    marginBottom: spacing.xxs,
  },
  txnQuantity: {
    ...typography.caption,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
});
