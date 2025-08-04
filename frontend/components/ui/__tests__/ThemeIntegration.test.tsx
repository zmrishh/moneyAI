/**
 * Theme Integration Tests
 * Tests the theme system integration and functionality
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Theme';

// Simple test component that uses theme context directly
function ThemeTestComponent() {
  const { theme } = useTheme();
  
  return (
    <View testID="themed-view" style={{ backgroundColor: theme.colors.surface.primary }}>
      <Text 
        testID="themed-text" 
        style={{ 
          color: theme.colors.text.primary,
          fontSize: theme.typography.lg.fontSize 
        }}
      >
        Test Content
      </Text>
    </View>
  );
}

describe('Theme Integration', () => {
  it('should render components with theme provider', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('themed-view')).toBeTruthy();
    expect(getByTestId('themed-text')).toBeTruthy();
  });

  it('should apply theme styles to components', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    const themedView = getByTestId('themed-view');
    const themedText = getByTestId('themed-text');

    // Check that styles are applied
    expect(themedView.props.style).toBeDefined();
    expect(themedText.props.style).toBeDefined();

    // Check that background color is applied to view
    expect(themedView.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.any(String),
      })
    );

    // Check that text color is applied
    expect(themedText.props.style).toMatchObject(
      expect.objectContaining({
        color: expect.any(String),
        fontSize: expect.any(Number),
      })
    );
  });

  it('should have consistent theme structure', () => {
    // Test light theme structure
    expect(lightTheme).toHaveProperty('name', 'light');
    expect(lightTheme).toHaveProperty('colors');
    expect(lightTheme).toHaveProperty('typography');
    expect(lightTheme).toHaveProperty('spacing');
    expect(lightTheme).toHaveProperty('breakpoints');
    expect(lightTheme).toHaveProperty('animations');

    // Test dark theme structure
    expect(darkTheme).toHaveProperty('name', 'dark');
    expect(darkTheme).toHaveProperty('colors');
    expect(darkTheme).toHaveProperty('typography');
    expect(darkTheme).toHaveProperty('spacing');
    expect(darkTheme).toHaveProperty('breakpoints');
    expect(darkTheme).toHaveProperty('animations');

    // Test color structure
    expect(lightTheme.colors).toHaveProperty('primary');
    expect(lightTheme.colors).toHaveProperty('surface');
    expect(lightTheme.colors).toHaveProperty('text');
    expect(lightTheme.colors).toHaveProperty('border');

    // Test typography structure
    expect(lightTheme.typography).toHaveProperty('base');
    expect(lightTheme.typography).toHaveProperty('lg');
    expect(lightTheme.typography.base).toHaveProperty('fontSize');
    expect(lightTheme.typography.base).toHaveProperty('lineHeight');

    // Test spacing structure
    expect(lightTheme.spacing).toHaveProperty('sm');
    expect(lightTheme.spacing).toHaveProperty('md');
    expect(lightTheme.spacing).toHaveProperty('lg');

    // Test breakpoints structure
    expect(lightTheme.breakpoints).toHaveProperty('mobile');
    expect(lightTheme.breakpoints).toHaveProperty('tablet');
    expect(lightTheme.breakpoints).toHaveProperty('desktop');
  });

  it('should have different colors for light and dark themes', () => {
    // Surface colors should be different
    expect(lightTheme.colors.surface.primary).not.toBe(darkTheme.colors.surface.primary);
    expect(lightTheme.colors.text.primary).not.toBe(darkTheme.colors.text.primary);
    
    // But structure should be the same
    expect(Object.keys(lightTheme.colors)).toEqual(Object.keys(darkTheme.colors));
    expect(Object.keys(lightTheme.colors.surface)).toEqual(Object.keys(darkTheme.colors.surface));
    expect(Object.keys(lightTheme.colors.text)).toEqual(Object.keys(darkTheme.colors.text));
  });

  it('should have valid color values', () => {
    // Test that colors are valid hex or rgba values
    const colorRegex = /^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgba?\([^)]+\))$/;
    
    expect(lightTheme.colors.surface.primary).toMatch(colorRegex);
    expect(lightTheme.colors.text.primary).toMatch(colorRegex);
    expect(darkTheme.colors.surface.primary).toMatch(colorRegex);
    expect(darkTheme.colors.text.primary).toMatch(colorRegex);
  });

  it('should have valid typography values', () => {
    // Test that typography values are numbers
    expect(typeof lightTheme.typography.base.fontSize).toBe('number');
    expect(typeof lightTheme.typography.base.lineHeight).toBe('number');
    expect(typeof lightTheme.typography.lg.fontSize).toBe('number');
    expect(typeof lightTheme.typography.lg.lineHeight).toBe('number');
    
    // Font sizes should be reasonable
    expect(lightTheme.typography.base.fontSize).toBeGreaterThan(10);
    expect(lightTheme.typography.base.fontSize).toBeLessThan(50);
    expect(lightTheme.typography.lg.fontSize).toBeGreaterThan(lightTheme.typography.base.fontSize);
  });

  it('should have valid spacing values', () => {
    // Test that spacing values are numbers
    expect(typeof lightTheme.spacing.sm).toBe('number');
    expect(typeof lightTheme.spacing.md).toBe('number');
    expect(typeof lightTheme.spacing.lg).toBe('number');
    
    // Spacing should be reasonable and progressive
    expect(lightTheme.spacing.sm).toBeGreaterThan(0);
    expect(lightTheme.spacing.md).toBeGreaterThan(lightTheme.spacing.sm);
    expect(lightTheme.spacing.lg).toBeGreaterThan(lightTheme.spacing.md);
  });

  it('should have valid breakpoint values', () => {
    // Test that breakpoint values are numbers
    expect(typeof lightTheme.breakpoints.mobile).toBe('number');
    expect(typeof lightTheme.breakpoints.tablet).toBe('number');
    expect(typeof lightTheme.breakpoints.desktop).toBe('number');
    
    // Breakpoints should be progressive
    expect(lightTheme.breakpoints.mobile).toBeGreaterThan(0);
    expect(lightTheme.breakpoints.tablet).toBeGreaterThan(lightTheme.breakpoints.mobile);
    expect(lightTheme.breakpoints.desktop).toBeGreaterThan(lightTheme.breakpoints.tablet);
  });
});