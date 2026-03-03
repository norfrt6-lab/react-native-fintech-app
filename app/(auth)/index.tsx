import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';

import { Button } from '@/src/ui/components/common';
import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography } from '@/src/ui/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBar === 'dark' ? 'dark' : 'light'} />

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={[styles.logo, { color: colors.primary }]}>FT</Text>
          <Text style={[styles.appName, { color: colors.text }]}>FinTrack</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Your portfolio, your control.{'\n'}Track, trade, and grow.
          </Text>
        </View>

        <View style={styles.features}>
          {[
            { icon: '📊', label: 'Real-time portfolio tracking' },
            { icon: '🔒', label: 'Bank-grade security' },
            { icon: '📈', label: '500+ cryptocurrencies' },
            { icon: '🌐', label: 'Works offline' },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>
                {feature.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={t('auth.login')}
          onPress={() => router.push('/(auth)/login')}
          variant="primary"
          size="lg"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title={t('auth.register')}
          onPress={() => router.push('/(auth)/register')}
          variant="outline"
          size="lg"
          fullWidth
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
    paddingHorizontal: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxxxl,
  },
  logo: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2,
  },
  appName: {
    ...typography.h1,
    marginTop: spacing.sm,
  },
  tagline: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
  features: {
    gap: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  featureText: {
    ...typography.body,
  },
  actions: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  spacer: {
    height: spacing.md,
  },
});
