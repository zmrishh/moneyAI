/**
 * CategoryIcon component for displaying category-specific icons with consistent styling
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { getCategoryIconConfig, getIconName } from './IconRegistry';

interface CategoryIconProps {
  category: string;
  size?: number;
  showBackground?: boolean;
  style?: StyleProp<ViewStyle>;
  useEmoji?: boolean; // Force emoji usage
}

export function CategoryIcon({
  category,
  size = 24,
  showBackground = false,
  style,
  useEmoji = false,
}: CategoryIconProps) {
  const config = getCategoryIconConfig(category);
  
  if (useEmoji) {
    return (
      <View style={[
        styles.container,
        showBackground && {
          backgroundColor: config.color + '20', // 20% opacity
          borderRadius: size / 2,
          width: size * 1.5,
          height: size * 1.5,
        },
        style
      ]}>
        <Text style={[styles.emoji, { fontSize: size }]}>
          {config.emoji}
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      showBackground && {
        backgroundColor: config.color + '20', // 20% opacity
        borderRadius: size / 2,
        width: size * 1.5,
        height: size * 1.5,
      },
      style
    ]}>
      <IconSymbol
        name={getIconName(category.toLowerCase().replace(/\s+/g, '-'), 'android') as any}
        size={size}
        color={config.color}
      />
    </View>
  );
}

/**
 * Get category emoji for fallback scenarios
 */
export function getCategoryEmoji(category: string): string {
  const config = getCategoryIconConfig(category);
  return config.emoji;
}

/**
 * Get category color for consistent theming
 */
export function getCategoryColor(category: string): string {
  const config = getCategoryIconConfig(category);
  return config.color;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});