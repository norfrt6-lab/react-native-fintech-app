import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import { AUTH } from '@/src/lib/constants';

interface PinPadProps {
  title: string;
  error?: string;
  onComplete: (pin: string) => void;
}

export function PinPad({ title, error, onComplete }: PinPadProps) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');

  const handlePress = useCallback(
    (digit: string) => {
      Haptics.selectionAsync();
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === AUTH.PIN_LENGTH) {
        onComplete(newPin);
        setPin('');
      }
    },
    [pin, onComplete],
  );

  const handleDelete = useCallback(() => {
    Haptics.selectionAsync();
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const dots = Array.from({ length: AUTH.PIN_LENGTH }, (_, i) => (
    <View
      key={i}
      style={[
        styles.dot,
        {
          backgroundColor: i < pin.length ? colors.primary : 'transparent',
          borderColor: colors.primary,
        },
      ]}
    />
  ));

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
      <View style={styles.dots}>{dots}</View>
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key) => {
              if (key === '') {
                return <View key="empty" style={styles.key} />;
              }
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key="del"
                    onPress={handleDelete}
                    style={styles.key}
                    accessibilityLabel="Delete"
                  >
                    <Text style={[styles.keyText, { color: colors.text }]}>
                      ←
                    </Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handlePress(key)}
                  style={[styles.key, { backgroundColor: colors.surface }]}
                  accessibilityLabel={key}
                >
                  <Text style={[styles.keyText, { color: colors.text }]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  keypad: {
    width: '100%',
    maxWidth: 300,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    ...typography.h3,
  },
});
