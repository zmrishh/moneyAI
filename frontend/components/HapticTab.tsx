import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { createTabA11yProps } from '@/utils/accessibility';

export function HapticTab(props: BottomTabBarButtonProps) {
  // Extract accessibility information from props
  const isSelected = props.accessibilityState?.selected || false;
  const tabLabel = props.accessibilityLabel || 'Tab';
  
  // Create proper accessibility props for tab
  const a11yProps = createTabA11yProps(
    tabLabel,
    isSelected,
    `Navigate to ${tabLabel} screen`
  );

  return (
    <PlatformPressable
      {...props}
      {...a11yProps}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
