import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, typography } from '../../theme';
import type { TimeRange } from '../../../types';

const TIME_RANGES: TimeRange[] = ['1H', '1D', '1W', '1M', '3M', '1Y', 'ALL'];

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
}

export function TimeRangeSelector({ selected, onSelect }: TimeRangeSelectorProps) {
  const { colors } = useTheme();

  const handleSelect = (range: TimeRange) => {
    Haptics.selectionAsync();
    onSelect(range);
  };

  return (
    <View style={styles.container}>
      {TIME_RANGES.map((range) => {
        const isActive = selected === range;
        return (
          <TouchableOpacity
            key={range}
            onPress={() => handleSelect(range)}
            style={[
              styles.button,
              {
                backgroundColor: isActive
                  ? colors.primary
                  : 'transparent',
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.text,
                {
                  color: isActive ? colors.textInverse : colors.textSecondary,
                },
              ]}
            >
              {range}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 42,
    alignItems: 'center',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
