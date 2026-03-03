import React, { useState } from 'react';
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

import { Button, Input } from '@/src/ui/components/common';
import { useTheme } from '@/src/ui/theme/ThemeContext';
import { useAuthStore } from '@/src/store';
import { spacing, typography } from '@/src/ui/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { setUser, setLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLocalLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLocalLoading(true);
    setError('');

    try {
      // Simulated auth - Firebase integration in Phase 2
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setUser({
        uid: 'demo-user-001',
        email: email.trim(),
        displayName: email.split('@')[0],
        photoURL: null,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      });

      router.replace('/(tabs)');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLocalLoading(false);
    }
  };

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
