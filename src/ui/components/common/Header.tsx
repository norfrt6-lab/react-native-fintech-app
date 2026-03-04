import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography } from '../../theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  transparent?: boolean;
  leftActionLabel?: string;
  rightActionLabel?: string;
}

export function Header({
  title,
  subtitle,
  leftAction,
  rightAction,
  onLeftPress,
  onRightPress,
  transparent = false,
  leftActionLabel,
  rightActionLabel,
}: HeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: transparent ? 'transparent' : colors.headerBackground,
          borderBottomColor: transparent ? 'transparent' : colors.divider,
        },
      ]}
    >
      <StatusBar barStyle={colors.statusBar === 'dark' ? 'dark-content' : 'light-content'} />
      <View style={styles.content}>
        <View style={styles.left}>
          {leftAction && (
            <TouchableOpacity
              onPress={onLeftPress}
              style={styles.action}
              accessibilityRole="button"
              accessibilityLabel={leftActionLabel ?? 'Navigation action'}
            >
              {leftAction}
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.right}>
          {rightAction && (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.action}
              accessibilityRole="button"
              accessibilityLabel={rightActionLabel ?? 'Action'}
            >
              {rightAction}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    minHeight: 44,
  },
  left: {
    width: 60,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 60,
    alignItems: 'flex-end',
  },
  title: {
    ...typography.h4,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  action: {
    padding: spacing.xs,
  },
});
