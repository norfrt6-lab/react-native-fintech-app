import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
  style?: ViewStyle;
}

export function FadeInView({
  children,
  delay = 0,
  duration = 400,
  translateY = 12,
  style,
}: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(translateY);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
    translate.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [opacity, translate, delay, duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
