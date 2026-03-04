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
import * as WebBrowser from 'expo-web-browser';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography, borderRadius } from '@/src/ui/theme';
import { ScreenErrorBoundary } from '@/src/ui/components/common';
import { useSettingsStore, useAuthStore, useNotificationStore } from '@/src/store';
import { APP_VERSION, AUTH, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from '@/src/lib/constants';
import { savePin, removePin } from '@/src/core/auth/pin';
import { PinPad } from '@/src/ui/components/auth';
import { Modal } from 'react-native';
import {
  checkBiometricCapability,
  enrollBiometric,
  unenrollBiometric,
  getBiometricLabel,
} from '@/src/core/auth';
import type { BiometricType } from '@/src/types';

type ThemeMode = 'light' | 'dark' | 'system';
type CurrencyCode = 'usd' | 'eur' | 'gbp' | 'jpy' | 'btc' | 'eth';
type LanguageCode = 'en' | 'ja' | 'zh';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const {
    theme,
    currency,
    language,
    notificationsEnabled,
    priceAlerts,
    hapticFeedback,
    biometricTradeConfirmation,
    setTheme,
    setCurrency,
    setLanguage,
    setNotificationsEnabled,
    setPriceAlerts,
    setHapticFeedback,
    setBiometricTradeConfirmation,
  } = useSettingsStore();

  const { logout, user, securitySettings, updateSecuritySettings } = useAuthStore();
  const alerts = useNotificationStore((s) => s.alerts);
  const clearTriggeredAlerts = useNotificationStore((s) => s.clearTriggeredAlerts);
  const clearHistory = useNotificationStore((s) => s.clearHistory);
  const activeAlertCount = alerts.filter((a) => a.status === 'active').length;

  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [biometricHardwareAvailable, setBiometricHardwareAvailable] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinStep, setPinStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [pinError, setPinError] = useState('');

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
        Alert.alert(t('settings.enrollmentFailed'), t('settings.enrollmentFailedMessage'));
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

  const handlePinToggle = async () => {
    if (securitySettings.pinEnabled) {
      await removePin();
      updateSecuritySettings({ pinEnabled: false });
    } else {
      setPinStep('create');
      setFirstPin('');
      setPinError('');
      setShowPinSetup(true);
    }
  };

  const handlePinComplete = async (pin: string) => {
    if (pinStep === 'create') {
      setFirstPin(pin);
      setPinStep('confirm');
      setPinError('');
    } else {
      if (pin === firstPin) {
        await savePin(pin);
        updateSecuritySettings({ pinEnabled: true });
        setShowPinSetup(false);
      } else {
        setPinError(t('common.error'));
        setPinStep('create');
        setFirstPin('');
      }
    }
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
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={value ? `${label}: ${value}` : label}
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
    <View
      style={[styles.settingRow, { borderBottomColor: colors.divider }]}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
    >
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
    <ScreenErrorBoundary>
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
              label={t('settings.biometricLogin', { type: getBiometricLabel(biometricType) })}
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
            label={t('settings.biometricTradeConfirmation')}
            value={biometricTradeConfirmation}
            onToggle={setBiometricTradeConfirmation}
          />
          <SettingRow
            label={t('settings.pin')}
            value={securitySettings.pinEnabled ? 'Enabled' : 'Disabled'}
            onPress={handlePinToggle}
          />
          <SettingToggle
            label={t('settings.screenshotPrevention')}
            value={securitySettings.screenshotPrevention}
            onToggle={(val) => updateSecuritySettings({ screenshotPrevention: val })}
          />
          <SettingRow
            label={t('settings.autoLock')}
            value={`${securitySettings.autoLockTimeout} min`}
          />
          <View style={styles.themeRow}>
            {AUTH.AUTO_LOCK_OPTIONS.map((minutes) => (
              <TouchableOpacity
                key={minutes}
                onPress={() => updateSecuritySettings({ autoLockTimeout: minutes })}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor:
                      securitySettings.autoLockTimeout === minutes ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: securitySettings.autoLockTimeout === minutes }}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color:
                        securitySettings.autoLockTimeout === minutes ? colors.textInverse : colors.text,
                    },
                  ]}
                >
                  {minutes}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
                accessibilityRole="radio"
                accessibilityState={{ selected: theme === mode }}
                accessibilityLabel={`${mode} theme`}
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

          <SettingRow
            label={t('settings.currency')}
            value={SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.name ?? currency.toUpperCase()}
          />
          <View style={styles.themeRow}>
            {SUPPORTED_CURRENCIES.slice(0, 4).map((c) => (
              <TouchableOpacity
                key={c.code}
                onPress={() => setCurrency(c.code as CurrencyCode)}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor:
                      currency === c.code ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: currency === c.code }}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color:
                        currency === c.code ? colors.textInverse : colors.text,
                    },
                  ]}
                >
                  {c.symbol} {c.code.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <SettingRow
            label={t('settings.language')}
            value={SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName ?? language}
          />
          <View style={styles.themeRow}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => {
                  setLanguage(lang.code as LanguageCode);
                  i18n.changeLanguage(lang.code);
                }}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor:
                      language === lang.code ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: language === lang.code }}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color:
                        language === lang.code ? colors.textInverse : colors.text,
                    },
                  ]}
                >
                  {lang.nativeName}
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
          <SettingRow
            label={t('settings.activePriceAlerts')}
            value={`${activeAlertCount}`}
          />
          <SettingRow
            label={t('settings.clearTriggeredAlerts')}
            onPress={() => {
              clearTriggeredAlerts();
              Alert.alert(t('settings.cleared'), t('settings.triggeredAlertsCleared'));
            }}
          />
          <SettingRow
            label={t('settings.clearNotificationHistory')}
            onPress={() => {
              clearHistory();
              Alert.alert(t('settings.cleared'), t('settings.notificationHistoryCleared'));
            }}
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
          <SettingRow
            label={t('settings.privacyPolicy')}
            onPress={() => WebBrowser.openBrowserAsync('https://fintrack.app/privacy')}
          />
          <SettingRow
            label={t('settings.termsOfService')}
            onPress={() => WebBrowser.openBrowserAsync('https://fintrack.app/terms')}
          />
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: colors.error }]}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>
            {t('auth.logout')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showPinSetup} animationType="slide" presentationStyle="formSheet">
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.pinHeader}>
            <TouchableOpacity onPress={() => setShowPinSetup(false)}>
              <Text style={[styles.settingLabel, { color: colors.primary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
          <PinPad
            title={pinStep === 'create' ? t('auth.createPin') : t('common.confirm')}
            error={pinError}
            onComplete={handlePinComplete}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </ScreenErrorBoundary>
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
  pinHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
