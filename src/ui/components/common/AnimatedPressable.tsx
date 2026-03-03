import React, { useCallback } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface AnimatedPressableProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  scaleDown?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'tab';
}

export function AnimatedPressable({
  onPress,
  children,
  style,
  scaleDown = 0.97,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scale.value = withSpring(scaleDown, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(0.8, { duration: 100 });
    })
    .onEnd(() => {
      onPress();
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(1, { duration: 100 });
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[style, animatedStyle, disabled && styles.disabled]}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
