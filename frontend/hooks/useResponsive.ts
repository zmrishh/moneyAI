/**
 * Responsive design hooks for MoneyAI
 * Provides breakpoint detection and responsive utilities
 */

import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export type BreakpointName = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: BreakpointName;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

export function useResponsive(): ResponsiveInfo {
  const { theme } = useTheme();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const { breakpoints } = theme;

  // Determine current breakpoint
  const getBreakpoint = (screenWidth: number): BreakpointName => {
    if (screenWidth >= breakpoints.desktop) return 'desktop';
    if (screenWidth >= breakpoints.tablet) return 'tablet';
    return 'mobile';
  };

  const breakpoint = getBreakpoint(width);
  const orientation = width > height ? 'landscape' : 'portrait';

  return {
    width,
    height,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    orientation,
  };
}

// Hook for responsive values based on breakpoints
export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}): T {
  const { breakpoint } = useResponsive();
  
  switch (breakpoint) {
    case 'desktop':
      return values.desktop ?? values.tablet ?? values.mobile;
    case 'tablet':
      return values.tablet ?? values.mobile;
    case 'mobile':
    default:
      return values.mobile;
  }
}

// Hook for responsive spacing
export function useResponsiveSpacing() {
  const { theme } = useTheme();
  const { isMobile, isTablet } = useResponsive();

  const getSpacing = (size: keyof typeof theme.spacing) => {
    const baseSpacing = theme.spacing[size];
    
    // Scale spacing based on screen size
    if (isMobile) return baseSpacing;
    if (isTablet) return Math.round(baseSpacing * 1.2);
    return Math.round(baseSpacing * 1.4);
  };

  return {
    xs: getSpacing('xs'),
    sm: getSpacing('sm'),
    md: getSpacing('md'),
    lg: getSpacing('lg'),
    xl: getSpacing('xl'),
    '2xl': getSpacing('2xl'),
    '3xl': getSpacing('3xl'),
    '4xl': getSpacing('4xl'),
  };
}

// Hook for responsive typography
export function useResponsiveTypography() {
  const { theme } = useTheme();
  const { isMobile, isTablet } = useResponsive();

  const getTypography = (size: keyof typeof theme.typography) => {
    const baseTypography = theme.typography[size];
    
    // Scale typography based on screen size
    const scaleFactor = isMobile ? 1 : isTablet ? 1.1 : 1.2;
    
    return {
      ...baseTypography,
      fontSize: Math.round(baseTypography.fontSize * scaleFactor),
      lineHeight: Math.round(baseTypography.lineHeight * scaleFactor),
    };
  };

  return {
    xs: getTypography('xs'),
    sm: getTypography('sm'),
    base: getTypography('base'),
    lg: getTypography('lg'),
    xl: getTypography('xl'),
    '2xl': getTypography('2xl'),
    '3xl': getTypography('3xl'),
    '4xl': getTypography('4xl'),
  };
}