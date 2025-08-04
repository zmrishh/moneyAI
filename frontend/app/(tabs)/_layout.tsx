import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#1A1A1A', // Match app's main background
          borderTopWidth: 0.5,
          borderTopColor: '#2C2C2E', // Subtle border
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 34 : 8,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
          color: theme.colors.text.secondary,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarAccessibilityLabel: 'Today tab',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? "house.fill" : "house"} 
              color={focused ? theme.colors.primary[500] : theme.colors.text.tertiary} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarAccessibilityLabel: 'Transactions tab',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? "list.bullet.rectangle.fill" : "list.bullet.rectangle"} 
              color={focused ? theme.colors.primary[500] : theme.colors.text.tertiary} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'AI Chat',
          tabBarAccessibilityLabel: 'AI Chat tab',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={28} 
              name="plus.circle.fill" 
              color={theme.colors.primary[500]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarAccessibilityLabel: 'Budgets tab',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? "chart.pie.fill" : "chart.pie"} 
              color={focused ? theme.colors.primary[500] : theme.colors.text.tertiary} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarAccessibilityLabel: 'Insights tab',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? "chart.bar.fill" : "chart.bar"} 
              color={focused ? theme.colors.primary[500] : theme.colors.text.tertiary} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
