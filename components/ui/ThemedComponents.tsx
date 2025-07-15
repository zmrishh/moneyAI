/**
 * Enhanced Themed Components for MoneyAI
 * Uses the comprehensive theme system with responsive design
 */

import React, { ReactNode } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  SafeAreaView,
  type TextProps, 
  type ViewProps,
  type TouchableOpacityProps,
  type TextInputProps,
  type ScrollViewProps,
  type SafeAreaViewProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme, useThemeColors, useThemeTypography } from '@/contexts/ThemeContext';
import { useResponsiveTypography, useResponsiveSpacing } from '@/hooks/useResponsive';

// Enhanced ThemedText with responsive typography
export interface ThemedTextProps extends TextProps {
  variant?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'disabled' | string;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right' | 'justify';
}

export function ThemedText({ 
  variant = 'base',
  color = 'primary',
  weight,
  align,
  style,
  ...props 
}: ThemedTextProps) {
  const colors = useThemeColors();
  const typography = useResponsiveTypography();
  
  const textColor = color in colors.text 
    ? colors.text[color as keyof typeof colors.text]
    : color;
  
  const textStyle: TextStyle = {
    ...typography[variant],
    color: textColor,
    fontWeight: weight || typography[variant].fontWeight,
    textAlign: align,
  };

  return <Text style={[textStyle, style]} {...props} />;
}

// Enhanced ThemedView with surface colors
export interface ThemedViewProps extends ViewProps {
  surface?: 'primary' | 'secondary' | 'tertiary' | 'elevated';
  backgroundColor?: string;
  padding?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  margin?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  borderRadius?: number;
  borderColor?: 'primary' | 'secondary' | 'focus' | 'error' | string;
  borderWidth?: number;
}

export function ThemedView({ 
  surface = 'primary',
  backgroundColor,
  padding,
  margin,
  borderRadius,
  borderColor,
  borderWidth,
  style,
  ...props 
}: ThemedViewProps) {
  const colors = useThemeColors();
  const spacing = useResponsiveSpacing();
  
  const getSpacingValue = (value: number | string) => {
    if (typeof value === 'number') return value;
    return spacing[value as keyof typeof spacing];
  };
  
  const bgColor = backgroundColor || colors.surface[surface];
  const bColor = borderColor && borderColor in colors.border
    ? colors.border[borderColor as keyof typeof colors.border]
    : borderColor;

  const viewStyle: ViewStyle = {
    backgroundColor: bgColor,
    padding: padding ? getSpacingValue(padding) : undefined,
    margin: margin ? getSpacingValue(margin) : undefined,
    borderRadius,
    borderColor: bColor,
    borderWidth,
  };

  return <View style={[viewStyle, style]} {...props} />;
}

// Themed Button Component
export interface ThemedButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function ThemedButton({ 
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  fullWidth = false,
  style,
  disabled,
  ...props 
}: ThemedButtonProps) {
  const colors = useThemeColors();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      width: fullWidth ? '100%' : undefined,
    };

    // Size variants
    const sizeStyles = {
      sm: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, minHeight: 32 },
      md: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 44 },
      lg: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 52 },
    };

    // Color variants
    const colorStyles = {
      primary: {
        backgroundColor: disabled ? colors.neutral[300] : colors.primary[500],
      },
      secondary: {
        backgroundColor: disabled ? colors.neutral[200] : colors.secondary[100],
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? colors.neutral[300] : colors.primary[500],
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...colorStyles[variant],
    };
  };

  const getTextColor = () => {
    if (disabled) return colors.text.disabled;
    
    switch (variant) {
      case 'primary':
        return colors.text.inverse;
      case 'secondary':
        return colors.text.primary;
      case 'outline':
        return colors.primary[500];
      case 'ghost':
        return colors.primary[500];
      default:
        return colors.text.primary;
    }
  };

  const textSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'base';

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={disabled || loading}
      {...props}
    >
      <ThemedText
        variant={textSize}
        color={getTextColor()}
        weight="semibold"
      >
        {loading ? 'Loading...' : children}
      </ThemedText>
    </TouchableOpacity>
  );
}

// Themed TextInput Component
export interface ThemedTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemedTextInput({ 
  label,
  error,
  helperText,
  size = 'md',
  style,
  ...props 
}: ThemedTextInputProps) {
  const colors = useThemeColors();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  
  const inputStyle: TextStyle = {
    borderWidth: 1,
    borderColor: error ? colors.border.error : colors.border.primary,
    borderRadius: 8,
    backgroundColor: colors.surface.primary,
    color: colors.text.primary,
    ...typography.base,
    paddingHorizontal: spacing.md,
    paddingVertical: size === 'sm' ? spacing.xs : size === 'lg' ? spacing.md : spacing.sm,
    minHeight: size === 'sm' ? 32 : size === 'lg' ? 52 : 44,
  };

  return (
    <View>
      {label && (
        <ThemedText
          variant="sm"
          color="secondary"
          weight="medium"
          style={{ marginBottom: spacing.xs }}
        >
          {label}
        </ThemedText>
      )}
      <TextInput
        style={[inputStyle, style]}
        placeholderTextColor={colors.text.tertiary}
        {...props}
      />
      {(error || helperText) && (
        <ThemedText
          variant="xs"
          color={error ? 'error' : 'tertiary'}
          style={{ marginTop: spacing.xs }}
        >
          {error || helperText}
        </ThemedText>
      )}
    </View>
  );
}

// Themed Card Component
export interface ThemedCardProps extends ViewProps {
  children: ReactNode;
  padding?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  elevated?: boolean;
}

export function ThemedCard({ 
  children,
  padding = 'md',
  elevated = false,
  style,
  ...props 
}: ThemedCardProps) {
  const colors = useThemeColors();
  const spacing = useResponsiveSpacing();
  
  const cardStyle: ViewStyle = {
    backgroundColor: elevated ? colors.surface.elevated : colors.surface.secondary,
    borderRadius: 12,
    padding: typeof padding === 'number' ? padding : spacing[padding],
    borderWidth: elevated ? 0 : 1,
    borderColor: colors.border.primary,
    // Add shadow for elevated cards
    ...(elevated && {
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    }),
  };

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
}

// Themed SafeAreaView
export interface ThemedSafeAreaViewProps extends SafeAreaViewProps {
  surface?: 'primary' | 'secondary' | 'tertiary';
}

export function ThemedSafeAreaView({ 
  surface = 'primary',
  style,
  ...props 
}: ThemedSafeAreaViewProps) {
  const colors = useThemeColors();
  
  const safeAreaStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.surface[surface],
  };

  return <SafeAreaView style={[safeAreaStyle, style]} {...props} />;
}

// Themed ScrollView
export interface ThemedScrollViewProps extends ScrollViewProps {
  surface?: 'primary' | 'secondary' | 'tertiary';
}

export function ThemedScrollView({ 
  surface = 'primary',
  style,
  ...props 
}: ThemedScrollViewProps) {
  const colors = useThemeColors();
  
  const scrollViewStyle: ViewStyle = {
    backgroundColor: colors.surface[surface],
  };

  return <ScrollView style={[scrollViewStyle, style]} {...props} />;
}