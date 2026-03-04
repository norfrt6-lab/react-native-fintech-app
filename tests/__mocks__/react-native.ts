import React from 'react';

export const Platform = {
  OS: 'ios',
  select: (opts: Record<string, unknown>) => opts.ios,
};

export const AppState = {
  currentState: 'active',
  addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
};

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  hairlineWidth: 0.5,
  flatten: (style: unknown): Record<string, unknown> => {
    if (Array.isArray(style)) {
      return Object.assign({}, ...style.filter(Boolean));
    }
    return (style as Record<string, unknown>) || {};
  },
};

export const Alert = {
  alert: jest.fn(),
};

export const Dimensions = {
  get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
};

export function useColorScheme() {
  return 'light';
}

// Simple component mocks that render as host elements for react-test-renderer
function createComponent(displayName: string) {
  const Component = (props: Record<string, unknown>) => {
    const { children, ...rest } = props;
    return React.createElement(displayName, rest, children as React.ReactNode);
  };
  Component.displayName = displayName;
  return Component;
}

export const View = createComponent('View');
export const Text = createComponent('Text');
export const TouchableOpacity = createComponent('TouchableOpacity');
export const TextInput = createComponent('TextInput');
export const ScrollView = createComponent('ScrollView');
export const FlatList = createComponent('FlatList');
export const Image = createComponent('Image');
export const Pressable = createComponent('Pressable');
export const ActivityIndicator = createComponent('ActivityIndicator');
