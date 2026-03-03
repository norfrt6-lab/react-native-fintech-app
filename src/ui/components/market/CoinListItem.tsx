import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, typography } from '../../theme';
import { PriceChange } from '../common/PriceChange';
import { formatCurrency } from '../../../lib/formatters';
import type { CoinMarketData } from '../../../types';

interface CoinListItemProps {
  coin: CoinMarketData;
  onPress: (coin: CoinMarketData) => void;
  showSparkline?: boolean;
}

export const CoinListItem = memo(function CoinListItem({
  coin,
  onPress,
  showSparkline = false,
}: CoinListItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => onPress(coin)}
      activeOpacity={0.6}
      style={[styles.container, { borderBottomColor: colors.divider }]}
    >
      <View style={styles.left}>
        <Image
          source={{ uri: coin.image }}
          style={styles.icon}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.nameContainer}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {coin.name}
          </Text>
          <Text style={[styles.symbol, { color: colors.textSecondary }]}>
            {coin.symbol.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={[styles.price, { color: colors.text }]}>
          {formatCurrency(coin.currentPrice)}
        </Text>
        <PriceChange value={coin.priceChangePercentage24h} size="sm" />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
  },
  nameContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  name: {
    ...typography.label,
  },
  symbol: {
    ...typography.caption,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    ...typography.label,
    marginBottom: 2,
  },
});
