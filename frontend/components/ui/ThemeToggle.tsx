/**
 * Theme Toggle Component for MoneyAI
 * Allows users to switch between light, dark, and auto themes
 */

import { useTheme } from '@/contexts/ThemeContext';
import { useResponsiveSpacing } from '@/hooks/useResponsive';
import { TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedComponents';

interface ThemeToggleProps {
  showLabels?: boolean;
  compact?: boolean;
}

export function ThemeToggle({ showLabels = true, compact = false }: ThemeToggleProps) {
  const { themeMode, setThemeMode, theme } = useTheme();
  const spacing = useResponsiveSpacing();
  const colors = theme.colors;

  const options = [
    { value: 'light' as const, label: 'Light', icon: '☀️' },
    { value: 'dark' as const, label: 'Dark', icon: '🌙' },
    { value: 'auto' as const, label: 'Auto', icon: '⚙️' },
  ];

  const containerStyle = {
    flexDirection: 'row' as const,
    backgroundColor: colors.surface.secondary,
    borderRadius: compact ? 6 : 8,
    padding: compact ? spacing.xs : spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
  };

  const buttonStyle = (isActive: boolean) => ({
    paddingHorizontal: compact ? spacing.sm : spacing.md,
    paddingVertical: compact ? spacing.xs : spacing.sm,
    borderRadius: compact ? 4 : 6,
    backgroundColor: isActive ? colors.primary[500] : 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minWidth: compact ? 32 : 44,
  });

  return (
    <View style={containerStyle}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option.value}
          style={[
            buttonStyle(themeMode === option.value),
            index > 0 && { marginLeft: compact ? spacing.xs : spacing.sm }
          ]}
          onPress={() => setThemeMode(option.value)}
          accessibilityLabel={`Switch to ${option.label} theme`}
          accessibilityRole="button"
        >
          <ThemedText
            variant={compact ? 'sm' : 'base'}
            color={themeMode === option.value ? colors.text.inverse : colors.text.primary}
            style={{ marginBottom: showLabels && !compact ? 2 : 0 }}
          >
            {option.icon}
          </ThemedText>
          {showLabels && !compact && (
            <ThemedText
              variant="xs"
              color={themeMode === option.value ? colors.text.inverse : colors.text.secondary}
              weight="medium"
            >
              {option.label}
            </ThemedText>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Simple icon-only theme toggle
export function ThemeToggleIcon() {
  const { isDark, toggleTheme } = useTheme();
  const { colors } = useTheme().theme;
  const spacing = useResponsiveSpacing();

  return (
    <TouchableOpacity
      style={{
        padding: spacing.sm,
        borderRadius: 8,
        backgroundColor: colors.surface.secondary,
        borderWidth: 1,
        borderColor: colors.border.primary,
      }}
      onPress={toggleTheme}
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      accessibilityRole="button"
    >
      <ThemedText variant="lg">
        {isDark ? '☀️' : '🌙'}
      </ThemedText>
    </TouchableOpacity>
  );
}