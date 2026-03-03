import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography } from '../../theme';
import { useConnectivityStore } from '../../../store/connectivity.store';

export function OfflineBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const status = useConnectivityStore((s) => s.status);
  const pendingCount = useConnectivityStore((s) => s.pendingSyncCount);

  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (status === 'offline') {
      translateY.value = withSpring(0);
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withSpring(-60);
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [status, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (status !== 'offline') return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: colors.warning, paddingTop: insets.top + spacing.xs },
        animatedStyle,
      ]}
    >
      <Text style={[styles.text, { color: '#000' }]}>
        No internet connection
        {pendingCount > 0 ? ` • ${pendingCount} pending` : ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    zIndex: 1000,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
