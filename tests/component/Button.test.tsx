import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '../../src/ui/components/common/Button';
import { AppThemeProvider } from '../../src/ui/theme/ThemeContext';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<AppThemeProvider forcedTheme="light">{ui}</AppThemeProvider>);
}

describe('Button', () => {
  const onPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title text', () => {
    renderWithTheme(<Button title="Submit" onPress={onPress} />);
    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    renderWithTheme(<Button title="Tap Me" onPress={onPress} />);
    fireEvent.press(screen.getByText('Tap Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not show title text when loading', () => {
    renderWithTheme(<Button title="Loading" onPress={onPress} loading />);
    expect(screen.queryByText('Loading')).toBeNull();
  });

  it('has accessibility label matching title', () => {
    const { root } = renderWithTheme(<Button title="Buy Now" onPress={onPress} />);
    const touchable = root.findByProps({ accessibilityRole: 'button' });
    expect(touchable.props.accessibilityLabel).toBe('Buy Now');
  });

  it('sets disabled state in accessibility when disabled', () => {
    const { root } = renderWithTheme(<Button title="Off" onPress={onPress} disabled />);
    const touchable = root.findByProps({ accessibilityRole: 'button' });
    expect(touchable.props.accessibilityState.disabled).toBe(true);
  });

  it('sets busy state in accessibility when loading', () => {
    const { root } = renderWithTheme(<Button title="Saving" onPress={onPress} loading />);
    const touchable = root.findByProps({ accessibilityRole: 'button' });
    expect(touchable.props.accessibilityState.busy).toBe(true);
  });

  it('sets disabled prop on touchable when disabled', () => {
    const { root } = renderWithTheme(<Button title="No" onPress={onPress} disabled />);
    const touchable = root.findByProps({ accessibilityRole: 'button' });
    expect(touchable.props.disabled).toBe(true);
  });

  it('triggers haptic feedback on press', () => {
    const Haptics = require('expo-haptics');
    renderWithTheme(<Button title="Haptic" onPress={onPress} />);
    fireEvent.press(screen.getByText('Haptic'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });
});
