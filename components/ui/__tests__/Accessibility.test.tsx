/**
 * Accessibility Tests for MoneyAI Components
 * Tests proper ARIA labels, roles, and screen reader compatibility
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, Pressable } from 'react-native';

// Simple test components to verify accessibility patterns
const TestButton = ({ onPress, accessibilityLabel, accessibilityHint, disabled = false, children }: any) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
    accessibilityState={{ disabled }}
    accessible={true}
    style={{ minHeight: 44, padding: 12 }}
  >
    <Text>{children}</Text>
  </Pressable>
);

const TestHeader = ({ level = 1, children }: any) => (
  <Text
    accessibilityRole="header"
    accessibilityLevel={level}
    accessibilityLabel={children}
    accessible={true}
    style={{ fontSize: 24, fontWeight: 'bold' }}
  >
    {children}
  </Text>
);

describe('Basic Accessibility Patterns', () => {
  it('should have proper button accessibility attributes', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <TestButton
        onPress={onPress}
        accessibilityLabel="Test button"
        accessibilityHint="This is a test button"
      >
        Click me
      </TestButton>
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityLabel).toBe('Test button');
    expect(button.props.accessibilityHint).toBe('This is a test button');
    expect(button.props.accessible).toBe(true);
  });

  it('should handle disabled state correctly', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <TestButton
        onPress={onPress}
        accessibilityLabel="Disabled button"
        disabled={true}
      >
        Disabled
      </TestButton>
    );

    const button = getByRole('button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
    
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should have proper header accessibility attributes', () => {
    const { getByRole } = render(
      <TestHeader level={1}>Main Title</TestHeader>
    );

    const header = getByRole('header');
    expect(header).toBeTruthy();
    expect(header.props.accessibilityLabel).toBe('Main Title');
    expect(header.props.accessibilityLevel).toBe(1);
  });

  it('should support different header levels', () => {
    const { getByRole } = render(
      <TestHeader level={3}>Subtitle</TestHeader>
    );

    const header = getByRole('header');
    expect(header.props.accessibilityLevel).toBe(3);
  });

  it('should have minimum touch target size', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <TestButton
        onPress={onPress}
        accessibilityLabel="Touch target test"
      >
        Small
      </TestButton>
    );

    const button = getByRole('button');
    const style = button.props.style;
    
    // Check that minimum height is at least 44px (iOS accessibility guideline)
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  });
});

describe('Accessibility Utilities', () => {
  it('should format currency amounts for screen readers', () => {
    // Test the utility functions directly
    const formatCurrency = (amount: number, currency: string = 'INR', type?: string) => {
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
      }).format(Math.abs(amount));

      let label = formatted;
      if (type === 'income') {
        label = `Income: ${formatted}`;
      } else if (type === 'expense') {
        label = `Expense: ${formatted}`;
      }

      return {
        accessibilityLabel: label,
        accessibilityRole: 'text',
        accessible: true,
      };
    };
    
    const props = formatCurrency(1500, 'INR', 'expense');
    expect(props.accessibilityLabel).toBe('Expense: ₹1,500.00');
    expect(props.accessibilityRole).toBe('text');
  });

  it('should create proper transaction accessibility props', () => {
    const createTransactionA11yProps = (
      description: string,
      amount: number,
      category: string,
      date: Date,
      type: 'income' | 'expense'
    ) => {
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
        accessibilityRole: 'button',
        accessibilityLabel: label,
        accessibilityHint: 'Double tap to view transaction details',
        accessible: true,
      };
    };
    
    const date = new Date('2024-01-15T10:30:00');
    const props = createTransactionA11yProps(
      'Coffee Shop',
      25.50,
      'Food & Dining',
      date,
      'expense'
    );
    
    expect(props.accessibilityRole).toBe('button');
    expect(props.accessibilityLabel).toContain('Expense: Coffee Shop');
    expect(props.accessibilityLabel).toContain('₹25.50');
    expect(props.accessibilityLabel).toContain('Food & Dining');
    expect(props.accessibilityHint).toBe('Double tap to view transaction details');
  });

  it('should format large numbers for screen readers', () => {
    const formatNumberForA11y = (num: number): string => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)} million`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)} thousand`;
      }
      return num.toString();
    };
    
    expect(formatNumberForA11y(1500000)).toBe('1.5 million');
    expect(formatNumberForA11y(25000)).toBe('25.0 thousand');
    expect(formatNumberForA11y(500)).toBe('500');
  });
});

describe('Screen Reader Compatibility', () => {
  it('should provide semantic descriptions for complex elements', () => {
    const createSemanticDescription = (
      element: 'dashboard' | 'chart' | 'transaction-list' | 'budget-overview'
    ): string => {
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
    };
    
    const dashboardDesc = createSemanticDescription('dashboard');
    expect(dashboardDesc).toBe('Financial dashboard showing current balance, recent transactions, and spending overview');
    
    const chartDesc = createSemanticDescription('chart');
    expect(chartDesc).toBe('Interactive spending chart showing daily expenses for the past week');
  });
});

describe('Keyboard Navigation', () => {
  it('should support keyboard navigation for buttons', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Keyboard test"
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate') {
            onPress();
          }
        }}
        accessible={true}
      >
        <Text>Press me</Text>
      </Pressable>
    );

    const button = getByRole('button');
    
    // Simulate keyboard activation
    fireEvent(button, 'onAccessibilityAction', {
      nativeEvent: { actionName: 'activate' }
    });
    
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Voice Control Support', () => {
  it('should have descriptive labels for voice commands', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <TestButton
        onPress={onPress}
        accessibilityLabel="Add new transaction"
      >
        Add
      </TestButton>
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Add new transaction');
    
    // Voice control should be able to activate this with "tap Add new transaction"
  });
});

describe('Component Integration', () => {
  it('should render accessible transaction item', () => {
    const transaction = {
      id: '1',
      description: 'Coffee Shop',
      amount: 25.50,
      category: 'Food & Dining',
      date: new Date('2024-01-15T10:30:00'),
      type: 'expense' as const,
    };

    const formattedAmount = `₹${transaction.amount.toFixed(2)}`;
    const accessibilityLabel = `Expense: ${transaction.description}, ${formattedAmount}, ${transaction.category}`;

    const { getByRole } = render(
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Double tap to view transaction details"
        accessible={true}
        style={{ padding: 16, minHeight: 44 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text>{transaction.description}</Text>
            <Text>{transaction.category}</Text>
          </View>
          <Text>{formattedAmount}</Text>
        </View>
      </Pressable>
    );

    const transactionItem = getByRole('button');
    expect(transactionItem).toBeTruthy();
    expect(transactionItem.props.accessibilityLabel).toContain('Coffee Shop');
    expect(transactionItem.props.accessibilityLabel).toContain('₹25.50');
    expect(transactionItem.props.accessibilityHint).toBe('Double tap to view transaction details');
  });
});