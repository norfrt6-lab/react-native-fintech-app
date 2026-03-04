import React from 'react';
import { View, Text, StyleSheet, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius } from '../../theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AvatarSize, number> = {
  sm: 28,
  md: 36,
  lg: 44,
  xl: 64,
};

interface AvatarProps {
  uri?: string;
  fallback?: string;
  size?: AvatarSize;
  style?: ImageStyle;
  accessibilityLabel?: string;
}

export function Avatar({ uri, fallback, size = 'md', style, accessibilityLabel }: AvatarProps) {
  const { colors } = useTheme();
  const dimension = SIZES[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          {
            width: dimension,
            height: dimension,
            borderRadius: borderRadius.full,
          },
          style,
        ]}
        contentFit="cover"
        transition={200}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel ?? (fallback ? `${fallback} avatar` : 'User avatar')}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderRadius: borderRadius.full,
          backgroundColor: colors.backgroundSecondary,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? (fallback ? `${fallback} avatar` : 'User avatar')}
    >
      <Text
        style={[
          styles.fallbackText,
          { color: colors.textSecondary, fontSize: dimension * 0.4 },
        ]}
      >
        {fallback?.charAt(0).toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontWeight: '600',
  },
});
