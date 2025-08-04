/**
 * Accessibility utilities for MoneyAI
 * Provides helper functions and constants for consistent accessibility implementation
 */

import { AccessibilityRole, AccessibilityState } from 'react-native';

// Common accessibility roles
export const A11Y_ROLES = {
  BUTTON: 'button' as AccessibilityRole,
  TAB: 'tab' as AccessibilityRole,
  HEADER: 'header' as AccessibilityRole,
  TEXT: 'text' as AccessibilityRole,
  IMAGE: 'image' as AccessibilityRole,
  LINK: 'link' as AccessibilityRole,
  SEARCH: 'search' as AccessibilityRole,
  MENU: 'menu' as AccessibilityRole,
  MENUITEM: 'menuitem' as AccessibilityRole,
  PROGRESSBAR: 'progressbar' as AccessibilityRole,
  ALERT: 'alert' as AccessibilityRole,
  SUMMARY: 'summary' as AccessibilityRole,
} as const;

// Common accessibility traits
export const A11Y_TRAITS = {
  SELECTED: 'selected',
  DISABLED: 'disabled',
  EXPANDED: 'expanded',
  CHECKED: 'checked',
} as const;

/**
 * Creates accessibility props for buttons
 */
export function createButtonA11yProps(
  label: string,
  hint?: string,
  state?: Partial<AccessibilityState>
) {
  return {
    accessibilityRole: A11Y_ROLES.BUTTON,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: state,
    accessible: true,
  };
}

/**
 * Creates accessibility props for tab buttons
 */
export function createTabA11yProps(
  label: string,
  isSelected: boolean,
  hint?: string
) {
  return {
    accessibilityRole: A11Y_ROLES.TAB,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { selected: isSelected },
    accessible: true,
  };
}

/**
 * Creates accessibility props for headers
 */
export function createHeaderA11yProps(text: string, level: number = 1) {
  return {
    accessibilityRole: A11Y_ROLES.HEADER,
    accessibilityLabel: text,
    accessibilityLevel: level,
    accessible: true,
  };
}

/**
 * Creates accessibility props for progress indicators
 */
export function createProgressA11yProps(
  label: string,
  current: number,
  max: number,
  hint?: string
) {
  const percentage = Math.round((current / max) * 100);
  return {
    accessibilityRole: A11Y_ROLES.PROGRESSBAR,
    accessibilityLabel: `${label}: ${percentage}% complete`,
    accessibilityHint: hint,
    accessibilityValue: {
      min: 0,
      max: max,
      now: current,
      text: `${current} of ${max}`,
    },
    accessible: true,
  };
}

/**
 * Creates accessibility props for currency amounts
 */
export function createCurrencyA11yProps(
  amount: number,
  currency: string = 'INR',
  type?: 'income' | 'expense' | 'balance'
) {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(Math.abs(amount));

  let label = formattedAmount;
  
  if (type === 'income') {
    label = `Income: ${formattedAmount}`;
  } else if (type === 'expense') {
    label = `Expense: ${formattedAmount}`;
  } else if (type === 'balance') {
    label = `Balance: ${formattedAmount}`;
  }

  return {
    accessibilityLabel: label,
    accessibilityRole: A11Y_ROLES.TEXT,
    accessible: true,
  };
}

/**
 * Creates accessibility props for transaction items
 */
export function createTransactionA11yProps(
  description: string,
  amount: number,
  category: string,
  date: Date,
  type: 'income' | 'expense'
) {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(Math.abs(amount));

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  const label = `${type === 'income' ? 'Income' : 'Expense'}: ${description}, ${formattedAmount}, ${category}, ${formattedDate}`;

  return {
    accessibilityRole: A11Y_ROLES.BUTTON,
    accessibilityLabel: label,
    accessibilityHint: 'Double tap to view transaction details',
    accessible: true,
  };
}

/**
 * Creates accessibility props for chart data points
 */
export function createChartDataA11yProps(
  day: string,
  amount: number,
  transactions: number
) {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);

  const label = `${day}: ${formattedAmount} spent in ${transactions} transaction${transactions !== 1 ? 's' : ''}`;

  return {
    accessibilityRole: A11Y_ROLES.BUTTON,
    accessibilityLabel: label,
    accessibilityHint: 'Double tap to view details for this day',
    accessible: true,
  };
}

/**
 * Creates accessibility props for category icons
 */
export function createCategoryIconA11yProps(category: string) {
  return {
    accessibilityRole: A11Y_ROLES.IMAGE,
    accessibilityLabel: `${category} category icon`,
    accessible: true,
  };
}

/**
 * Creates accessibility props for search functionality
 */
export function createSearchA11yProps(placeholder: string, value?: string) {
  return {
    accessibilityRole: A11Y_ROLES.SEARCH,
    accessibilityLabel: placeholder,
    accessibilityValue: value ? { text: value } : undefined,
    accessibilityHint: 'Enter text to search transactions',
    accessible: true,
  };
}

/**
 * Formats numbers for screen readers
 */
export function formatNumberForA11y(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} million`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} thousand`;
  }
  return num.toString();
}

/**
 * Creates semantic content description for complex UI elements
 */
export function createSemanticDescription(
  element: 'dashboard' | 'chart' | 'transaction-list' | 'budget-overview',
  data?: any
): string {
  switch (element) {
    case 'dashboard':
      return 'Financial dashboard showing current balance, recent transactions, and spending overview';
    case 'chart':
      return 'Interactive spending chart showing daily expenses for the past week';
    case 'transaction-list':
      return 'List of recent financial transactions grouped by date';
    case 'budget-overview':
      return 'Budget overview showing spending progress across different categories';
    default:
      return 'Financial information display';
  }
}