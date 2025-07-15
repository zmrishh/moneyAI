// Enhanced IconSymbol component with unified registry support

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps, useMemo } from 'react';
import { OpaqueColorValue, Platform, type StyleProp, type TextStyle } from 'react-native';
import { getIconName, hasIcon, ICON_REGISTRY } from './IconRegistry';

// Legacy mapping for backward compatibility
type LegacyIconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
const LEGACY_MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'magnifyingglass': 'search',
  'xmark.circle.fill': 'clear',
} as LegacyIconMapping;

// Union type for all possible icon names
type IconSymbolName = keyof typeof ICON_REGISTRY | keyof typeof LEGACY_MAPPING | SymbolViewProps['name'];

/**
 * Enhanced icon component that uses unified icon registry with platform-specific mappings.
 * Provides automatic fallback system and consistent icons across platforms.
 * 
 * Features:
 * - Unified icon registry with platform-specific mappings
 * - Automatic fallback for missing icons
 * - Backward compatibility with existing icon names
 * - Platform-optimized icon selection
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = useMemo(() => {
    // First check if it's in the new registry
    if (hasIcon(name as string)) {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      return getIconName(name as string, platform);
    }
    
    // Fall back to legacy mapping
    if (name in LEGACY_MAPPING) {
      return LEGACY_MAPPING[name as keyof typeof LEGACY_MAPPING];
    }
    
    // If it's a direct Material Icon name, use it
    return name as ComponentProps<typeof MaterialIcons>['name'];
  }, [name]);

  return (
    <MaterialIcons 
      color={color} 
      size={size} 
      name={iconName} 
      style={style} 
    />
  );
}
