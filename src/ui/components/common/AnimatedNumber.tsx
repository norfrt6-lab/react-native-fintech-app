import React, { useEffect } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  value: number;
  formatter: (value: number) => string;
  style?: TextStyle;
  duration?: number;
}

export function AnimatedNumber({
  value,
  formatter,
  style,
  duration = 600,
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, animatedValue, duration]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: formatter(animatedValue.value),
      defaultValue: '',
    };
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      style={[style, { padding: 0, margin: 0 }]}
      animatedProps={animatedProps}
    />
  );
}
