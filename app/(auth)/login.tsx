import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { Button, Input, Divider } from '@/src/ui/components/common';
import { useTheme } from '@/src/ui/theme/ThemeContext';
import { useAuthStore } from '@/src/store';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import {
  checkBiometricCapability,
  authenticateWithBiometric,
  isBiometricEnrolled,
  getBiometricLabel,
} from '@/src/core/auth';
import type { BiometricType } from '@/src/types';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { login: authLogin, securitySettings } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLocalLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');

  useEffect(() => {
    if (securitySettings.biometricEnabled) {
      Promise.all([checkBiometricCapability(), isBiometricEnrolled()]).then(
        ([capability, enrolled]) => {
          if (capability.isAvailable && enrolled) {
            setBiometricAvailable(true);
            setBiometricType(capability.biometricType);
          }
        },
      );
    }
  }, [securitySettings.biometricEnabled]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLocalLoading(true);
    setError('');

    try {
      const result = await authLogin(email.trim(), password);

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error ?? 'Invalid email or password');
      }
    } catch {
      setError('Invalid email or password');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleBiometricLogin = useCallback(async () => {
    setError('');
    const result = await authenticateWithBiometric('Sign in to FinTrack');

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLocalLoading(true);

      const loginResult = await authLogin('user@fintrack.app', 'biometric-session');

      if (loginResult.success) {
        router.replace('/(tabs)');
      } else {
        setError(loginResult.error ?? 'Authentication failed');
      }
      setLocalLoading(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? 'Biometric authentication failed');
    }
  }, [authLogin, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBar === 'dark' ? 'dark' : 'light'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.primary }]}>
              {t('common.back')}
            </Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('auth.welcome')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to access your portfolio
            </Text>
          </View>

          {biometricAvailable && (
            <>
              <TouchableOpacity
                onPress={handleBiometricLogin}
                style={[styles.biometricButton, { borderColor: colors.primary, backgroundColor: colors.surface }]}
                activeOpacity={0.7}
              >
                <Text style={styles.biometricIcon}>
                  {biometricType === 'facial' ? '👤' : '👆'}
                </Text>
                <Text style={[styles.biometricText, { color: colors.primary }]}>
                  Sign in with {getBiometricLabel(biometricType)}
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <Divider style={styles.dividerLine} />
                <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
                <Divider style={styles.dividerLine} />
              </View>
            </>
          )}

          <View style={styles.form}>
            <Input
              label={t('auth.email')}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label={t('auth.password')}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <Text style={{ color: colors.textSecondary }}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {error ? (
              <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
            ) : null}

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <Button
              title={t('auth.login')}
              onPress={handleLogin}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                {t('auth.register')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
  },
  backButton: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backText: {
    ...typography.label,
  },
  header: {
    marginTop: spacing.xxxl,
    marginBottom: spacing.xxxl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  biometricIcon: {
    fontSize: 24,
  },
  biometricText: {
    ...typography.button,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
  },
  dividerText: {
    ...typography.caption,
  },
  form: {},
  error: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xxl,
  },
  forgotText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  footerText: {
    ...typography.bodySmall,
  },
  footerLink: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
