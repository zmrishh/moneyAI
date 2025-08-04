/**
 * Unified Icon Registry for MoneyAI
 * Provides consistent icon mappings across platforms with fallback support
 */

import { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps } from 'expo-symbols';

// Platform-specific icon definitions
export interface IconDefinition {
  ios: SymbolViewProps['name'];
  android: ComponentProps<typeof MaterialIcons>['name'];
  web: ComponentProps<typeof MaterialIcons>['name'];
  fallback: ComponentProps<typeof MaterialIcons>['name'];
}

// Category icon mappings with colors
export interface CategoryIconConfig {
  icon: IconDefinition;
  color: string;
  emoji: string; // Fallback emoji for extreme cases
}

// Core icon registry
export const ICON_REGISTRY: Record<string, IconDefinition> = {
  // Navigation icons
  'home': {
    ios: 'house.fill',
    android: 'home',
    web: 'home',
    fallback: 'home'
  },
  'transactions': {
    ios: 'list.bullet',
    android: 'list',
    web: 'list',
    fallback: 'list'
  },
  'insights': {
    ios: 'chart.bar.fill',
    android: 'bar-chart',
    web: 'bar-chart',
    fallback: 'assessment'
  },
  'settings': {
    ios: 'gearshape.fill',
    android: 'settings',
    web: 'settings',
    fallback: 'settings'
  },
  
  // Search and filter icons
  'search': {
    ios: 'magnifyingglass',
    android: 'search',
    web: 'search',
    fallback: 'search'
  },
  'filter': {
    ios: 'line.3.horizontal.decrease',
    android: 'filter-list',
    web: 'filter-list',
    fallback: 'filter-list'
  },
  'clear': {
    ios: 'xmark.circle.fill',
    android: 'clear',
    web: 'clear',
    fallback: 'clear'
  },
  
  // Action icons
  'add': {
    ios: 'plus.circle.fill',
    android: 'add-circle',
    web: 'add-circle',
    fallback: 'add'
  },
  'edit': {
    ios: 'pencil',
    android: 'edit',
    web: 'edit',
    fallback: 'edit'
  },
  'delete': {
    ios: 'trash',
    android: 'delete',
    web: 'delete',
    fallback: 'delete'
  },
  'share': {
    ios: 'square.and.arrow.up',
    android: 'share',
    web: 'share',
    fallback: 'share'
  },
  'split': {
    ios: 'rectangle.split.2x1',
    android: 'call-split',
    web: 'call-split',
    fallback: 'call-split'
  },
  'repeat': {
    ios: 'repeat',
    android: 'repeat',
    web: 'repeat',
    fallback: 'repeat'
  },
  
  // Status icons
  'success': {
    ios: 'checkmark.circle.fill',
    android: 'check-circle',
    web: 'check-circle',
    fallback: 'check'
  },
  'warning': {
    ios: 'exclamationmark.triangle.fill',
    android: 'warning',
    web: 'warning',
    fallback: 'warning'
  },
  'error': {
    ios: 'xmark.circle.fill',
    android: 'error',
    web: 'error',
    fallback: 'error'
  },
  'info': {
    ios: 'info.circle.fill',
    android: 'info',
    web: 'info',
    fallback: 'info'
  },
  
  // Financial icons
  'income': {
    ios: 'arrow.up.circle.fill',
    android: 'trending-up',
    web: 'trending-up',
    fallback: 'arrow-upward'
  },
  'expense': {
    ios: 'arrow.down.circle.fill',
    android: 'trending-down',
    web: 'trending-down',
    fallback: 'arrow-downward'
  },
  'transfer': {
    ios: 'arrow.left.arrow.right',
    android: 'swap-horiz',
    web: 'swap-horiz',
    fallback: 'swap-horiz'
  },
  'budget': {
    ios: 'chart.pie.fill',
    android: 'pie-chart',
    web: 'pie-chart',
    fallback: 'pie-chart'
  },
  'goal': {
    ios: 'target',
    android: 'flag',
    web: 'flag',
    fallback: 'flag'
  },
  'safe-to-spend': {
    ios: 'dollarsign.circle.fill',
    android: 'account-balance-wallet',
    web: 'account-balance-wallet',
    fallback: 'account-balance'
  },
  
  // Bill and payment icons
  'bill': {
    ios: 'doc.text.fill',
    android: 'receipt',
    web: 'receipt',
    fallback: 'receipt'
  },
  'payment': {
    ios: 'creditcard.fill',
    android: 'payment',
    web: 'payment',
    fallback: 'payment'
  },
  'reminder': {
    ios: 'bell.fill',
    android: 'notifications',
    web: 'notifications',
    fallback: 'notifications'
  },
  'overdue': {
    ios: 'clock.badge.exclamationmark',
    android: 'schedule',
    web: 'schedule',
    fallback: 'access-time'
  },
  
  // Social and IOU icons
  'person': {
    ios: 'person.fill',
    android: 'person',
    web: 'person',
    fallback: 'person'
  },
  'group': {
    ios: 'person.2.fill',
    android: 'group',
    web: 'group',
    fallback: 'group'
  },
  'request-money': {
    ios: 'hand.raised.fill',
    android: 'pan-tool',
    web: 'pan-tool',
    fallback: 'pan-tool'
  },
  'send-money': {
    ios: 'paperplane.fill',
    android: 'send',
    web: 'send',
    fallback: 'send'
  }
};

// Category-specific icon configurations
export const CATEGORY_ICONS: Record<string, CategoryIconConfig> = {
  'Food & Dining': {
    icon: {
      ios: 'fork.knife',
      android: 'restaurant',
      web: 'restaurant',
      fallback: 'restaurant'
    },
    color: '#FF6B6B',
    emoji: '🍽️'
  },
  'Transportation': {
    icon: {
      ios: 'car.fill',
      android: 'directions-car',
      web: 'directions-car',
      fallback: 'directions-car'
    },
    color: '#4ECDC4',
    emoji: '🚗'
  },
  'Shopping': {
    icon: {
      ios: 'bag.fill',
      android: 'shopping-bag',
      web: 'shopping-bag',
      fallback: 'shopping-cart'
    },
    color: '#45B7D1',
    emoji: '🛍️'
  },
  'Entertainment': {
    icon: {
      ios: 'tv.fill',
      android: 'movie',
      web: 'movie',
      fallback: 'movie'
    },
    color: '#96CEB4',
    emoji: '🎬'
  },
  'Bills & Utilities': {
    icon: {
      ios: 'lightbulb.fill',
      android: 'lightbulb-outline',
      web: 'lightbulb-outline',
      fallback: 'lightbulb-outline'
    },
    color: '#FFEAA7',
    emoji: '💡'
  },
  'Healthcare': {
    icon: {
      ios: 'cross.fill',
      android: 'local-hospital',
      web: 'local-hospital',
      fallback: 'local-hospital'
    },
    color: '#FD79A8',
    emoji: '🏥'
  },
  'Income': {
    icon: {
      ios: 'dollarsign.circle.fill',
      android: 'attach-money',
      web: 'attach-money',
      fallback: 'attach-money'
    },
    color: '#00B894',
    emoji: '💰'
  },
  'Groceries': {
    icon: {
      ios: 'cart.fill',
      android: 'shopping-cart',
      web: 'shopping-cart',
      fallback: 'shopping-cart'
    },
    color: '#A29BFE',
    emoji: '🛒'
  },
  'Education': {
    icon: {
      ios: 'book.fill',
      android: 'school',
      web: 'school',
      fallback: 'school'
    },
    color: '#6C5CE7',
    emoji: '📚'
  },
  'Travel': {
    icon: {
      ios: 'airplane',
      android: 'flight',
      web: 'flight',
      fallback: 'flight'
    },
    color: '#FD79A8',
    emoji: '✈️'
  },
  'Fitness': {
    icon: {
      ios: 'figure.run',
      android: 'fitness-center',
      web: 'fitness-center',
      fallback: 'fitness-center'
    },
    color: '#00B894',
    emoji: '💪'
  },
  'Subscriptions': {
    icon: {
      ios: 'repeat.circle.fill',
      android: 'subscriptions',
      web: 'subscriptions',
      fallback: 'repeat'
    },
    color: '#E17055',
    emoji: '🔄'
  }
};

// Default fallback configuration
export const DEFAULT_ICON_CONFIG: CategoryIconConfig = {
  icon: {
    ios: 'doc.text.fill',
    android: 'description',
    web: 'description',
    fallback: 'description'
  },
  color: '#8E8E93',
  emoji: '📝'
};

/**
 * Get icon configuration for a category
 */
export function getCategoryIconConfig(category: string): CategoryIconConfig {
  return CATEGORY_ICONS[category] || DEFAULT_ICON_CONFIG;
}

/**
 * Get platform-specific icon name
 */
export function getIconName(iconKey: string, platform: 'ios' | 'android' | 'web' = 'android'): string {
  const iconDef = ICON_REGISTRY[iconKey];
  if (!iconDef) {
    console.warn(`Icon '${iconKey}' not found in registry, using fallback`);
    return 'help-outline'; // Ultimate fallback
  }
  
  return iconDef[platform] || iconDef.fallback;
}

/**
 * Check if an icon exists in the registry
 */
export function hasIcon(iconKey: string): boolean {
  return iconKey in ICON_REGISTRY;
}