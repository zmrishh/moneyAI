/**
 * Accessible UI Components for MoneyAI
 * Pre-built components with proper accessibility support
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
  AccessibilityState,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';
import { createButtonA11yProps, createHeaderA11yProps, createProgressA11yProps } from '@/utils/accessibility';

interface AccessibleButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Fully accessible button component with proper ARIA attributes
 */
export function AccessibleButton({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: AccessibleButtonProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const buttonStyles = {
    primary: {
      backgroundColor: disabled ? colors.neutral[300] : colors.primary[500],
      borderColor: disabled ? colors.neutral[300] : colors.primary[500],
    },
    secondary: {
      backgroundColor: colors.surface.secondary,
      borderColor: colors.border.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  };

  const textColors = {
    primary: disabled ? colors.text.disabled : colors.text.inverse,
    secondary: colors.text.primary,
    ghost: colors.text.primary,
  };

  const sizes = {
    sm: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
    md: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
    lg: { paddingHorizontal: 20, paddingVertical: 16, fontSize: 18 },
  };

  const a11yProps = createButtonA11yProps(
    accessibilityLabel,
    accessibilityHint,
    { disabled: disabled || loading }
  );

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={[
        styles.button,
        buttonStyles[variant],
        sizes[size],
        style,
        disabled && styles.disabled,
      ]}
      testID={testID}
      {...a11yProps}
    >
      {loading ? (
        <Text style={[styles.buttonText, { color: textColors[variant] }]}>
          Loading...
        </Text>
      ) : (
        <Text style={[styles.buttonText, { color: textColors[variant], fontSize: sizes[size].fontSize }]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

interface AccessibleHeaderProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  style?: TextStyle;
  testID?: string;
}

/**
 * Accessible header component with proper semantic hierarchy
 */
export function AccessibleHeader({ children, level = 1, style, testID }: AccessibleHeaderProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const headerSizes = {
    1: 32,
    2: 28,
    3: 24,
    4: 20,
    5: 18,
    6: 16,
  };

  const a11yProps = createHeaderA11yProps(children as string, level);

  return (
    <Text
      style={[
        styles.header,
        {
          fontSize: headerSizes[level],
          color: colors.text.primary,
        },
        style,
      ]}
      testID={testID}
      {...a11yProps}
    >
      {children}
    </Text>
  );
}

interface AccessibleProgressBarProps {
  current: number;
  max: number;
  label: string;
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Accessible progress bar with proper ARIA attributes
 */
export function AccessibleProgressBar({
  current,
  max,
  label,
  showPercentage = true,
  color,
  backgroundColor,
  height = 8,
  style,
  testID,
}: AccessibleProgressBarProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const percentage = Math.min((current / max) * 100, 100);
  const a11yProps = createProgressA11yProps(label, current, max);

  return (
    <View style={[styles.progressContainer, style]} testID={testID}>
      {showPercentage && (
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.text.primary }]}>
            {label}
          </Text>
          <Text style={[styles.progressPercentage, { color: colors.text.secondary }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      )}
      <View
        style={[
          styles.progressTrack,
          {
            height,
            backgroundColor: backgroundColor || colors.neutral[200],
          },
        ]}
        {...a11yProps}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: color || colors.primary[500],
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

interface AccessibleIconButtonProps {
  onPress: () => void;
  iconName: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  size?: number;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Accessible icon button with proper touch targets and labels
 */
export function AccessibleIconButton({
  onPress,
  iconName,
  accessibilityLabel,
  accessibilityHint,
  size = 24,
  color,
  disabled = false,
  style,
  testID,
}: AccessibleIconButtonProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const a11yProps = createButtonA11yProps(
    accessibilityLabel,
    accessibilityHint,
    { disabled }
  );

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.iconButton,
        {
          backgroundColor: colors.surface.secondary,
          borderColor: colors.border.primary,
        },
        disabled && styles.disabled,
        style,
      ]}
      testID={testID}
      {...a11yProps}
    >
      <IconSymbol
        name={iconName}
        size={size}
        color={color || (disabled ? colors.text.disabled : colors.text.primary)}
      />
    </Pressable>
  );
}

interface AccessibleCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Accessible card component with optional press handling
 */
export function AccessibleCard({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: AccessibleCardProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const a11yProps = onPress
    ? createButtonA11yProps(accessibilityLabel || 'Card', accessibilityHint)
    : { accessible: true, accessibilityLabel };

  const CardComponent = onPress ? Pressable : View;

  return (
    <CardComponent
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface.secondary,
          borderColor: colors.border.primary,
        },
        style,
      ]}
      testID={testID}
      {...a11yProps}
    >
      {children}
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target size
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  header: {
    fontWeight: '700',
    marginBottom: 8,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressTrack: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 4,
  },
  iconButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44, // Minimum touch target size
    minHeight: 44,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 4,
  },
});