import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
}

export function Card({
  children,
  onPress,
  elevated = false,
  style,
  padding = 'lg',
}: CardProps) {
  const { colors } = useTheme();

  const cardStyle: (ViewStyle | undefined)[] = [
    styles.card,
    {
      backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
      borderColor: colors.borderLight,
      padding: spacing[padding],
    },
    elevated ? shadows.md : shadows.sm,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
});
