import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../../src/ui/components/common/Card';
import { Badge } from '../../src/ui/components/common/Badge';
import { Avatar } from '../../src/ui/components/common/Avatar';
import { AppThemeProvider } from '../../src/ui/theme/ThemeContext';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: Record<string, unknown>) => <View testID="avatar-image" {...props} />,
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<AppThemeProvider forcedTheme="light">{ui}</AppThemeProvider>);
}

describe('Accessibility', () => {
  describe('Card', () => {
    it('has accessibilityRole button when pressable', () => {
      const { root } = renderWithTheme(
        <Card onPress={jest.fn()} accessibilityLabel="Open details">
          <Text>Content</Text>
        </Card>,
      );
      const button = root.findByProps({ accessibilityRole: 'button' });
      expect(button.props.accessibilityLabel).toBe('Open details');
    });

    it('does not have button role when not pressable', () => {
      const { root } = renderWithTheme(
        <Card>
          <Text>Content</Text>
        </Card>,
      );
      const buttons = root.findAllByProps({ accessibilityRole: 'button' });
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Badge', () => {
    it('has accessibilityRole text and label', () => {
      const { root } = renderWithTheme(
        <Badge text="Active" variant="success" />,
      );
      const badge = root.findByProps({ accessibilityRole: 'text' });
      expect(badge.props.accessibilityLabel).toBe('Active');
    });
  });

  describe('Avatar', () => {
    it('has accessibilityRole image with fallback label', () => {
      const { root } = renderWithTheme(
        <Avatar fallback="JD" />,
      );
      const avatar = root.findByProps({ accessibilityRole: 'image' });
      expect(avatar.props.accessibilityLabel).toBe('JD avatar');
    });

    it('has custom accessibilityLabel when provided', () => {
      const { root } = renderWithTheme(
        <Avatar fallback="JD" accessibilityLabel="John Doe profile picture" />,
      );
      const avatar = root.findByProps({ accessibilityRole: 'image' });
      expect(avatar.props.accessibilityLabel).toBe('John Doe profile picture');
    });

    it('has accessibilityRole image when uri is provided', () => {
      const { root } = renderWithTheme(
        <Avatar uri="https://example.com/photo.jpg" fallback="JD" />,
      );
      const avatar = root.findByProps({ accessibilityRole: 'image' });
      expect(avatar.props.accessibilityLabel).toBe('JD avatar');
    });
  });
});
