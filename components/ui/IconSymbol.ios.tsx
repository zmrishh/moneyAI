import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle, Text } from 'react-native';
import { useMemo } from 'react';
import { getIconName, hasIcon, ICON_REGISTRY, getCategoryIconConfig } from './IconRegistry';

// Legacy mapping for backward compatibility
const LEGACY_MAPPING = {
  'house.fill': 'house.fill',
  'paperplane.fill': 'paperplane.fill',
  'chevron.left.forwardslash.chevron.right': 'chevron.left.forwardslash.chevron.right',
  'chevron.right': 'chevron.right',
  'magnifyingglass': 'magnifyingglass',
  'xmark.circle.fill': 'xmark.circle.fill',
} as Record<string, SymbolViewProps['name']>;

// Union type for all possible icon names
type IconSymbolName = keyof typeof ICON_REGISTRY | keyof typeof LEGACY_MAPPING | SymbolViewProps['name'];

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const { iconName, shouldUseFallback } = useMemo(() => {
    // First check if it's in the new registry
    if (hasIcon(name as string)) {
      const iosIconName = getIconName(name as string, 'ios');
      return { iconName: iosIconName as SymbolViewProps['name'], shouldUseFallback: false };
    }
    
    // Fall back to legacy mapping
    if (name in LEGACY_MAPPING) {
      return { iconName: LEGACY_MAPPING[name as keyof typeof LEGACY_MAPPING], shouldUseFallback: false };
    }
    
    // Try to use the name directly as SF Symbol
    try {
      return { iconName: name as SymbolViewProps['name'], shouldUseFallback: false };
    } catch {
      // If SF Symbol fails, we'll use emoji fallback
      return { iconName: name as SymbolViewProps['name'], shouldUseFallback: true };
    }
  }, [name]);

  // If we should use fallback, try to get emoji from category config
  if (shouldUseFallback) {
    const categoryConfig = getCategoryIconConfig(name as string);
    return (
      <Text style={[{ fontSize: size, color }, style]}>
        {categoryConfig.emoji}
      </Text>
    );
  }

  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={iconName}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
