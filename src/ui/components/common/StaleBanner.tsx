import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography, borderRadius } from '../../theme';

interface StaleBannerProps {
  lastUpdatedAt: number | null;
  onRefresh?: () => void;
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function StaleBanner({ lastUpdatedAt, onRefresh }: StaleBannerProps) {
  const { colors } = useTheme();

  if (!lastUpdatedAt) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
      <Text style={[styles.text, { color: colors.warning }]}>
        Data last updated {getTimeAgo(lastUpdatedAt)}
      </Text>
      {onRefresh && (
        <TouchableOpacity onPress={onRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.refreshText, { color: colors.warning }]}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.caption,
    fontWeight: '500',
  },
  refreshText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
