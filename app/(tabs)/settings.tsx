import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import { Divider } from '@/src/ui/components/common';
import { useSettingsStore, useAuthStore } from '@/src/store';
import { APP_VERSION } from '@/src/lib/constants';
import {
  checkBiometricCapability,
  enrollBiometric,
  unenrollBiometric,
  getBiometricLabel,
} from '@/src/core/auth';
import type { BiometricType } from '@/src/types';

type ThemeMode = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const {
    theme,
    notificationsEnabled,
    priceAlerts,
    hapticFeedback,
    biometricTradeConfirmation,
    setTheme,
    setNotificationsEnabled,
    setPriceAlerts,
    setHapticFeedback,
    setBiometricTradeConfirmation,
  } = useSettingsStore();

  const { logout, user, securitySettings, updateSecuritySettings } = useAuthStore();
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [biometricHardwareAvailable, setBiometricHardwareAvailable] = useState(false);

  useEffect(() => {
    checkBiometricCapability().then((cap) => {
      setBiometricHardwareAvailable(cap.isAvailable);
      setBiometricType(cap.biometricType);
    });
  }, []);

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await enrollBiometric(user?.uid ?? '');
      if (success) {
        updateSecuritySettings({
          biometricEnabled: true,
          biometricType,
        });
      } else {
        Alert.alert('Enrollment Failed', 'Could not enable biometric authentication.');
      }
    } else {
      await unenrollBiometric();
      updateSecuritySettings({
        biometricEnabled: false,
        biometricType: 'none',
      });
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)');
  };

  const SettingRow = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.settingRow, { borderBottomColor: colors.divider }]}
      activeOpacity={0.6}
    >
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      {value && (
        <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
          {value}
        </Text>
      )}
    </TouchableOpacity>
  );

  const SettingToggle = ({
    label,
    value,
    onToggle,
  }: {
    label: string;
    value: boolean;
    onToggle: (val: boolean) => void;
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.textInverse}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('settings.title')}
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.security')}
          </Text>
          {biometricHardwareAvailable && (
            <SettingToggle
              label={`${getBiometricLabel(biometricType)} Login`}
              value={securitySettings.biometricEnabled}
              onToggle={handleBiometricToggle}
            />
          )}
          <SettingToggle
            label={t('settings.hideBalance')}
            value={securitySettings.hideBalance}
            onToggle={(val) => updateSecuritySettings({ hideBalance: val })}
          />
          <SettingToggle
            label="Biometric Trade Confirmation"
            value={biometricTradeConfirmation}
            onToggle={setBiometricTradeConfirmation}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.preferences')}
          </Text>
          <SettingRow
            label={t('settings.theme')}
            value={t(`settings.theme${theme.charAt(0).toUpperCase() + theme.slice(1)}` as never)}
          />
          <View style={styles.themeRow}>
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setTheme(mode)}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor:
                      theme === mode ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color:
                        theme === mode ? colors.textInverse : colors.text,
                    },
                  ]}
                >
                  {t(`settings.theme${mode.charAt(0).toUpperCase() + mode.slice(1)}` as never)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.notifications')}
          </Text>
          <SettingToggle
            label={t('settings.notifications')}
            value={notificationsEnabled}
            onToggle={setNotificationsEnabled}
          />
          <SettingToggle
            label={t('settings.priceAlerts')}
            value={priceAlerts}
            onToggle={setPriceAlerts}
          />
          <SettingToggle
            label={t('settings.haptic')}
            value={hapticFeedback}
            onToggle={setHapticFeedback}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.about')}
          </Text>
          <SettingRow
            label={t('settings.version')}
            value={APP_VERSION}
          />
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: colors.error }]}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>
            {t('auth.logout')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: {
    ...typography.body,
  },
  settingValue: {
    ...typography.bodySmall,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  themeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  themeButtonText: {
    ...typography.buttonSmall,
  },
  logoutButton: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    marginTop: spacing.xl,
  },
  logoutText: {
    ...typography.button,
  },
});
