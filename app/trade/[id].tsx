import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/ui/theme/ThemeContext';
import { spacing, typography } from '@/src/ui/theme';
import { useTradeStore } from '@/src/store';

export default function TradeModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { setFormData } = useTradeStore();

  useEffect(() => {
    if (id) {
      setFormData({ coinId: id });
    }
  }, [id, setFormData]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.closeText, { color: colors.primary }]}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('tabs.trade')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.info, { color: colors.textSecondary }]}>
          Trade form for {id} — Full implementation in Phase 5
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  closeText: {
    ...typography.label,
  },
  title: {
    ...typography.h4,
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  info: {
    ...typography.body,
    textAlign: 'center',
  },
});
