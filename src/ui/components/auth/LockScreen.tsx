import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography, borderRadius } from '../../theme';
import { Button } from '../common';
import {
  authenticateWithBiometric,
  checkBiometricCapability,
  getBiometricLabel,
} from '../../../core/auth';
import type { BiometricType } from '../../../types';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { colors } = useTheme();
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [error, setError] = useState('');

  useEffect(() => {
    checkBiometricCapability().then((cap) => {
      setBiometricType(cap.biometricType);
      if (cap.isAvailable) {
        handleBiometricUnlock();
      }
    });
  }, []);

  const handleBiometricUnlock = useCallback(async () => {
    setError('');
    const result = await authenticateWithBiometric('Unlock FinTrack');

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUnlock();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? 'Authentication failed');
    }
  }, [onUnlock]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.lockIcon}>
          <Text style={styles.lockEmoji}>🔒</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>FinTrack Locked</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Authenticate to unlock
        </Text>

        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}

        <Button
          title={
            biometricType !== 'none'
              ? `Unlock with ${getBiometricLabel(biometricType)}`
              : 'Unlock'
          }
          onPress={handleBiometricUnlock}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.unlockButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  lockEmoji: {
    fontSize: 48,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  error: {
    ...typography.bodySmall,
    marginBottom: spacing.lg,
  },
  unlockButton: {
    marginTop: spacing.lg,
  },
});
