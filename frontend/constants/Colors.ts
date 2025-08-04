/**
 * Legacy Colors for backward compatibility
 * New components should use the comprehensive theme system from Theme.ts
 */

import { lightTheme, darkTheme } from './Theme';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// Legacy color structure for backward compatibility
export const Colors = {
  light: {
    text: lightTheme.colors.text.primary,
    background: lightTheme.colors.surface.primary,
    tint: tintColorLight,
    icon: lightTheme.colors.text.tertiary,
    tabIconDefault: lightTheme.colors.text.tertiary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: darkTheme.colors.text.primary,
    background: darkTheme.colors.surface.primary,
    tint: tintColorDark,
    icon: darkTheme.colors.text.tertiary,
    tabIconDefault: darkTheme.colors.text.tertiary,
    tabIconSelected: tintColorDark,
  },
};
