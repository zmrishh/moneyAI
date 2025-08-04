/**
 * Keyboard Navigation Utilities for MoneyAI
 * Provides consistent keyboard navigation support across the app
 */

import { Platform } from 'react-native';

export interface KeyboardNavigationProps {
  onAccessibilityAction?: (event: any) => void;
  accessibilityActions?: Array<{
    name: string;
    label: string;
  }>;
}

/**
 * Creates keyboard navigation props for interactive elements
 */
export function createKeyboardNavigationProps(
  onActivate: () => void,
  customActions?: Array<{ name: string; label: string; action: () => void }>
): KeyboardNavigationProps {
  const actions = [
    { name: 'activate', label: 'Activate' },
    ...(customActions || []),
  ];

  return {
    accessibilityActions: actions,
    onAccessibilityAction: (event) => {
      const { actionName } = event.nativeEvent;
      
      switch (actionName) {
        case 'activate':
          onActivate();
          break;
        default:
          // Handle custom actions
          const customAction = customActions?.find(a => a.name === actionName);
          if (customAction) {
            customAction.action();
          }
          break;
      }
    },
  };
}

/**
 * Common keyboard shortcuts and their accessibility actions
 */
export const KeyboardShortcuts = {
  // Navigation shortcuts
  TAB: 'tab',
  SHIFT_TAB: 'shift+tab',
  ENTER: 'enter',
  SPACE: 'space',
  ESCAPE: 'escape',
  
  // Arrow navigation
  ARROW_UP: 'arrow_up',
  ARROW_DOWN: 'arrow_down',
  ARROW_LEFT: 'arrow_left',
  ARROW_RIGHT: 'arrow_right',
  
  // Common actions
  DELETE: 'delete',
  BACKSPACE: 'backspace',
  HOME: 'home',
  END: 'end',
};

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusableElements: Set<number> = new Set();
  private static currentFocusIndex: number = -1;

  /**
   * Registers a focusable element
   */
  static registerFocusableElement(reactTag: number): void {
    this.focusableElements.add(reactTag);
  }

  /**
   * Unregisters a focusable element
   */
  static unregisterFocusableElement(reactTag: number): void {
    this.focusableElements.delete(reactTag);
  }

  /**
   * Moves focus to the next focusable element
   */
  static focusNext(): void {
    const elements = Array.from(this.focusableElements);
    if (elements.length === 0) return;

    this.currentFocusIndex = (this.currentFocusIndex + 1) % elements.length;
    const nextElement = elements[this.currentFocusIndex];
    
    if (Platform.OS !== 'web') {
      // Use AccessibilityInfo.setAccessibilityFocus for native platforms
      const { AccessibilityInfo } = require('react-native');
      AccessibilityInfo.setAccessibilityFocus(nextElement);
    }
  }

  /**
   * Moves focus to the previous focusable element
   */
  static focusPrevious(): void {
    const elements = Array.from(this.focusableElements);
    if (elements.length === 0) return;

    this.currentFocusIndex = this.currentFocusIndex <= 0 
      ? elements.length - 1 
      : this.currentFocusIndex - 1;
    
    const previousElement = elements[this.currentFocusIndex];
    
    if (Platform.OS !== 'web') {
      const { AccessibilityInfo } = require('react-native');
      AccessibilityInfo.setAccessibilityFocus(previousElement);
    }
  }

  /**
   * Sets focus to a specific element
   */
  static setFocus(reactTag: number): void {
    if (this.focusableElements.has(reactTag)) {
      const elements = Array.from(this.focusableElements);
      this.currentFocusIndex = elements.indexOf(reactTag);
      
      if (Platform.OS !== 'web') {
        const { AccessibilityInfo } = require('react-native');
        AccessibilityInfo.setAccessibilityFocus(reactTag);
      }
    }
  }

  /**
   * Clears all registered elements
   */
  static clear(): void {
    this.focusableElements.clear();
    this.currentFocusIndex = -1;
  }
}

/**
 * Hook for keyboard navigation in functional components
 */
export function useKeyboardNavigation(
  onActivate: () => void,
  customActions?: Array<{ name: string; label: string; action: () => void }>
) {
  const navigationProps = createKeyboardNavigationProps(onActivate, customActions);
  
  return {
    ...navigationProps,
    // Additional utilities
    registerElement: FocusManager.registerFocusableElement,
    unregisterElement: FocusManager.unregisterFocusableElement,
  };
}

/**
 * Accessibility action definitions for common UI patterns
 */
export const AccessibilityActions = {
  // Button actions
  ACTIVATE: { name: 'activate', label: 'Activate' },
  
  // List actions
  SELECT: { name: 'select', label: 'Select' },
  EXPAND: { name: 'expand', label: 'Expand' },
  COLLAPSE: { name: 'collapse', label: 'Collapse' },
  
  // Navigation actions
  GO_BACK: { name: 'go_back', label: 'Go back' },
  GO_FORWARD: { name: 'go_forward', label: 'Go forward' },
  
  // Edit actions
  EDIT: { name: 'edit', label: 'Edit' },
  DELETE: { name: 'delete', label: 'Delete' },
  COPY: { name: 'copy', label: 'Copy' },
  
  // Custom financial actions
  VIEW_DETAILS: { name: 'view_details', label: 'View details' },
  ADD_TO_BUDGET: { name: 'add_to_budget', label: 'Add to budget' },
  CATEGORIZE: { name: 'categorize', label: 'Categorize' },
  SPLIT_TRANSACTION: { name: 'split_transaction', label: 'Split transaction' },
};

/**
 * Screen reader announcements for financial data
 */
export const ScreenReaderAnnouncements = {
  /**
   * Announces balance changes
   */
  balanceChanged: (newBalance: number, currency: string = 'INR') => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(newBalance);
    
    return `Balance updated to ${formatted}`;
  },

  /**
   * Announces transaction added
   */
  transactionAdded: (amount: number, description: string, type: 'income' | 'expense') => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Math.abs(amount));
    
    return `${type === 'income' ? 'Income' : 'Expense'} added: ${description}, ${formatted}`;
  },

  /**
   * Announces budget status
   */
  budgetStatus: (category: string, spent: number, budget: number) => {
    const percentage = Math.round((spent / budget) * 100);
    const remaining = budget - spent;
    
    const spentFormatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(spent);
    
    const remainingFormatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(remaining);
    
    return `${category} budget: ${percentage}% used, ${spentFormatted} spent, ${remainingFormatted} remaining`;
  },

  /**
   * Announces chart data selection
   */
  chartDataSelected: (day: string, amount: number, transactions: number) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
    
    return `${day}: ${formatted} spent in ${transactions} transaction${transactions !== 1 ? 's' : ''}`;
  },
};

/**
 * Keyboard navigation configuration for different screen types
 */
export const NavigationConfig = {
  dashboard: {
    focusOrder: ['balance', 'chart', 'recent-transactions', 'quick-actions'],
    shortcuts: {
      [KeyboardShortcuts.ARROW_DOWN]: 'next',
      [KeyboardShortcuts.ARROW_UP]: 'previous',
      [KeyboardShortcuts.ENTER]: 'activate',
    },
  },
  
  transactions: {
    focusOrder: ['search', 'filter', 'transaction-list'],
    shortcuts: {
      [KeyboardShortcuts.ARROW_DOWN]: 'next-transaction',
      [KeyboardShortcuts.ARROW_UP]: 'previous-transaction',
      [KeyboardShortcuts.ENTER]: 'view-transaction',
      [KeyboardShortcuts.DELETE]: 'delete-transaction',
    },
  },
  
  budgets: {
    focusOrder: ['overview', 'category-list', 'add-budget'],
    shortcuts: {
      [KeyboardShortcuts.ARROW_DOWN]: 'next-category',
      [KeyboardShortcuts.ARROW_UP]: 'previous-category',
      [KeyboardShortcuts.ENTER]: 'edit-budget',
    },
  },
};