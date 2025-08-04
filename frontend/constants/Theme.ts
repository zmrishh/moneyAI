/**
 * Comprehensive theme system for MoneyAI
 * Supports light/dark modes with responsive design tokens
 */

export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SurfaceColors {
  primary: string;
  secondary: string;
  tertiary: string;
  elevated: string;
  overlay: string;
}

export interface ColorPalette {
  primary: ColorShades;
  secondary: ColorShades;
  success: ColorShades;
  warning: ColorShades;
  error: ColorShades;
  neutral: ColorShades;
  surface: SurfaceColors;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
  };
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
  };
}

export interface TypographyScale {
  xs: { fontSize: number; lineHeight: number; fontWeight?: string };
  sm: { fontSize: number; lineHeight: number; fontWeight?: string };
  base: { fontSize: number; lineHeight: number; fontWeight?: string };
  lg: { fontSize: number; lineHeight: number; fontWeight?: string };
  xl: { fontSize: number; lineHeight: number; fontWeight?: string };
  '2xl': { fontSize: number; lineHeight: number; fontWeight?: string };
  '3xl': { fontSize: number; lineHeight: number; fontWeight?: string };
  '4xl': { fontSize: number; lineHeight: number; fontWeight?: string };
}

export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
}

export interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface AnimationConfig {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface Theme {
  name: 'light' | 'dark';
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
  breakpoints: Breakpoints;
  animations: AnimationConfig;
}

// Light theme colors
const lightColors: ColorPalette = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    inverse: '#ffffff',
    disabled: '#94a3b8',
  },
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    focus: '#0ea5e9',
    error: '#ef4444',
  },
};

// Dark theme colors
const darkColors: ColorPalette = {
  primary: {
    50: '#0c4a6e',
    100: '#075985',
    200: '#0369a1',
    300: '#0284c7',
    400: '#0ea5e9',
    500: '#38bdf8',
    600: '#7dd3fc',
    700: '#bae6fd',
    800: '#e0f2fe',
    900: '#f0f9ff',
  },
  secondary: {
    50: '#0f172a',
    100: '#1e293b',
    200: '#334155',
    300: '#475569',
    400: '#64748b',
    500: '#94a3b8',
    600: '#cbd5e1',
    700: '#e2e8f0',
    800: '#f1f5f9',
    900: '#f8fafc',
  },
  success: {
    50: '#14532d',
    100: '#166534',
    200: '#15803d',
    300: '#16a34a',
    400: '#22c55e',
    500: '#4ade80',
    600: '#86efac',
    700: '#bbf7d0',
    800: '#dcfce7',
    900: '#f0fdf4',
  },
  warning: {
    50: '#78350f',
    100: '#92400e',
    200: '#b45309',
    300: '#d97706',
    400: '#f59e0b',
    500: '#fbbf24',
    600: '#fcd34d',
    700: '#fde68a',
    800: '#fef3c7',
    900: '#fffbeb',
  },
  error: {
    50: '#7f1d1d',
    100: '#991b1b',
    200: '#b91c1c',
    300: '#dc2626',
    400: '#ef4444',
    500: '#f87171',
    600: '#fca5a5',
    700: '#fecaca',
    800: '#fee2e2',
    900: '#fef2f2',
  },
  neutral: {
    50: '#18181b',
    100: '#27272a',
    200: '#3f3f46',
    300: '#52525b',
    400: '#71717a',
    500: '#a1a1aa',
    600: '#d4d4d8',
    700: '#e4e4e7',
    800: '#f4f4f5',
    900: '#fafafa',
  },
  surface: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    elevated: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    inverse: '#0f172a',
    disabled: '#64748b',
  },
  border: {
    primary: '#334155',
    secondary: '#475569',
    focus: '#38bdf8',
    error: '#f87171',
  },
};

// Shared design tokens
const typography: TypographyScale = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  '2xl': { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  '3xl': { fontSize: 30, lineHeight: 36, fontWeight: '800' },
  '4xl': { fontSize: 36, lineHeight: 40, fontWeight: '800' },
};

const spacing: SpacingScale = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

const breakpoints: Breakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
};

const animations: AnimationConfig = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Theme definitions
export const lightTheme: Theme = {
  name: 'light',
  colors: lightColors,
  typography,
  spacing,
  breakpoints,
  animations,
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: darkColors,
  typography,
  spacing,
  breakpoints,
  animations,
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};