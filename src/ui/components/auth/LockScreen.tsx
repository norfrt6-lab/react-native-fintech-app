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
import { PinPad } from './PinPad';
import {
  authenticateWithBiometric,
  checkBiometricCapability,
  getBiometricLabel,
  verifyPin,
  checkLockout,
  recordFailedAttempt,
  resetAttempts,
} from '../../../core/auth';
import { useAuthStore } from '../../../store/auth.store';
import type { BiometricType } from '../../../types';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { colors } = useTheme();
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [error, setError] = useState('');
  const [showPinPad, setShowPinPad] = useState(false);
  const pinEnabled = useAuthStore((s) => s.securitySettings.pinEnabled);

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

  useEffect(() => {
    checkBiometricCapability().then((cap) => {
      setBiometricType(cap.biometricType);
      setBiometricAvailable(cap.isAvailable);
      if (cap.isAvailable) {
        handleBiometricUnlock();
      } else if (pinEnabled) {
        setShowPinPad(true);
      }
    });
  }, [handleBiometricUnlock, pinEnabled]);

  const handlePinComplete = async (pin: string) => {
    const lockout = await checkLockout();
    if (lockout.locked) {
      const mins = Math.ceil(lockout.remainingMs / 60000);
      setError(`Locked out. Try again in ${mins} min`);
      return;
    }

    const valid = await verifyPin(pin);
    if (valid) {
      await resetAttempts();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUnlock();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const result = await recordFailedAttempt();
      if (result.locked) {
        setError('Too many attempts. Locked out for 5 minutes.');
      } else {
        setError(`Wrong PIN. ${result.attemptsLeft} attempts left`);
      }
    }
  };

  if (showPinPad) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <PinPad
          title="Enter PIN"
          error={error}
          onComplete={handlePinComplete}
        />
        {biometricAvailable && (
          <Button
            title={`Use ${getBiometricLabel(biometricType)}`}
            onPress={() => { setShowPinPad(false); handleBiometricUnlock(); }}
            variant="outline"
            size="md"
            style={styles.switchButton}
          />
        )}
      </SafeAreaView>
    );
  }

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

        {pinEnabled && (
          <Button
            title="Use PIN"
            onPress={() => setShowPinPad(true)}
            variant="outline"
            size="md"
            style={styles.switchButton}
          />
        )}
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
  switchButton: {
    marginTop: spacing.md,
  },
});
