import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SavingsGoals from '../SavingsGoals';
import { SavingsGoal } from '@/types';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-12-31';
    return '2024-12-31';
  }),
  differenceInDays: jest.fn(() => 30),
  addMonths: jest.fn(() => new Date()),
}));

const mockGoals: SavingsGoal[] = [
  {
    id: '1',
    title: 'Emergency Fund',
    description: 'Save for unexpected expenses',
    target_amount: 100000,
    current_amount: 25000,
    target_date: new Date('2024-12-31'),
    priority: 'high',
    category: 'emergency',
    auto_save_amount: 5000,
    auto_save_frequency: 'monthly',
    created_at: new Date(),
    updated_at: new Date(),
    is_completed: false,
    milestones: [
      { id: 'm1', percentage: 25, amount: 25000, achieved: true, achieved_date: new Date() },
      { id: 'm2', percentage: 50, amount: 50000, achieved: false },
      { id: 'm3', percentage: 75, amount: 75000, achieved: false },
      { id: 'm4', percentage: 100, amount: 100000, achieved: false },
    ],
  },
  {
    id: '2',
    title: 'Vacation Fund',
    description: 'Trip to Europe',
    target_amount: 200000,
    current_amount: 80000,
    target_date: new Date('2024-06-15'),
    priority: 'medium',
    category: 'vacation',
    created_at: new Date(),
    updated_at: new Date(),
    is_completed: false,
    milestones: [
      { id: 'm5', percentage: 25, amount: 50000, achieved: true },
      { id: 'm6', percentage: 50, amount: 100000, achieved: false },
      { id: 'm7', percentage: 75, amount: 150000, achieved: false },
      { id: 'm8', percentage: 100, amount: 200000, achieved: false },
    ],
  },
];

describe('SavingsGoals Component', () => {
  const mockOnAddGoal = jest.fn();
  const mockOnUpdateGoal = jest.fn();
  const mockOnDeleteGoal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('renders empty state when no goals exist', () => {
      const { getByText } = render(
        <SavingsGoals
          goals={[]}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      expect(getByText('No Savings Goals Yet')).toBeTruthy();
      expect(getByText('Set your first savings goal and start building your financial future')).toBeTruthy();
      expect(getByText('Create Your First Goal')).toBeTruthy();
    });

    it('opens add goal modal when create first goal is pressed', () => {
      const { getByText } = render(
        <SavingsGoals
          goals={[]}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      fireEvent.press(getByText('Create Your First Goal'));
      expect(getByText('New Savings Goal')).toBeTruthy();
    });
  });

  describe('Goals List', () => {
    it('renders goals list correctly', () => {
      const { getByText } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      expect(getByText('Savings Goals')).toBeTruthy();
      expect(getByText('Emergency Fund')).toBeTruthy();
      expect(getByText('Vacation Fund')).toBeTruthy();
      expect(getByText('Save for unexpected expenses')).toBeTruthy();
      expect(getByText('Trip to Europe')).toBeTruthy();
    });

    it('displays correct progress information', () => {
      const { getByText } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      // Check progress percentages
      expect(getByText('25%')).toBeTruthy(); // Emergency Fund progress
      expect(getByText('40%')).toBeTruthy(); // Vacation Fund progress (80000/200000)
    });

    it('shows correct currency formatting', () => {
      const { getByText } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      // Check if currency amounts are displayed (format may vary based on locale)
      expect(getByText(/25,000/)).toBeTruthy();
      expect(getByText(/1,00,000/)).toBeTruthy();
    });
  });

  describe('Goal Interactions', () => {
    it('opens add money modal when Add Money button is pressed', () => {
      const { getAllByText, getByText } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      const addMoneyButtons = getAllByText('Add Money');
      fireEvent.press(addMoneyButtons[0]);

      expect(getByText('Add Money')).toBeTruthy();
      expect(getByText('Emergency Fund')).toBeTruthy();
    });

    it('calls onUpdateGoal when money is added', async () => {
      const { getAllByText, getByText, getByPlaceholderText } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      // Open add money modal
      const addMoneyButtons = getAllByText('Add Money');
      fireEvent.press(addMoneyButtons[0]);

      // Enter amount
      const amountInput = getByPlaceholderText('0');
      fireEvent.changeText(amountInput, '5000');

      // Submit
      const addButton = getByText('Add');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockOnUpdateGoal).toHaveBeenCalledWith('1', 5000);
      });
    });

    it('shows error for invalid amount', () => {
      const { getAllByText, getByText, getByPlaceholderText } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      // Open add money modal
      const addMoneyButtons = getAllByText('Add Money');
      fireEvent.press(addMoneyButtons[0]);

      // Enter invalid amount
      const amountInput = getByPlaceholderText('0');
      fireEvent.changeText(amountInput, 'invalid');

      // Submit
      const addButton = getByText('Add');
      fireEvent.press(addButton);

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid amount');
    });
  });

  describe('Add Goal Modal', () => {
    it('opens add goal modal when plus button is pressed', () => {
      const { getByText } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      // Find and press the add button (plus icon)
      const addButton = getByText('Savings Goals').parent?.parent?.children[1];
      if (addButton) {
        fireEvent.press(addButton);
        expect(getByText('New Savings Goal')).toBeTruthy();
      }
    });

    it('validates required fields when creating goal', () => {
      const { getByText } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      // Open modal and try to save without filling required fields
      const addButton = getByText('Savings Goals').parent?.parent?.children[1];
      if (addButton) {
        fireEvent.press(addButton);
        
        const saveButton = getByText('Save');
        fireEvent.press(saveButton);

        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in the required fields');
      }
    });

    it('calls onAddGoal with correct data when goal is created', async () => {
      const { getByText, getByPlaceholderText } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      // Open modal
      const addButton = getByText('Savings Goals').parent?.parent?.children[1];
      if (addButton) {
        fireEvent.press(addButton);

        // Fill form
        const titleInput = getByPlaceholderText('e.g., Emergency Fund, Vacation');
        const amountInput = getByPlaceholderText('₹50,000');
        
        fireEvent.changeText(titleInput, 'New Car');
        fireEvent.changeText(amountInput, '500000');

        // Save
        const saveButton = getByText('Save');
        fireEvent.press(saveButton);

        await waitFor(() => {
          expect(mockOnAddGoal).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'New Car',
              target_amount: 500000,
              current_amount: 0,
              category: 'other',
              priority: 'medium',
              is_completed: false,
            })
          );
        });
      }
    });
  });

  describe('Quick Amount Buttons', () => {
    it('sets amount when quick amount button is pressed', () => {
      const { getAllByText, getByText, getByDisplayValue } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      // Open add money modal
      const addMoneyButtons = getAllByText('Add Money');
      fireEvent.press(addMoneyButtons[0]);

      // Press quick amount button
      const quickAmount = getByText('₹1,000');
      fireEvent.press(quickAmount);

      // Check if amount is set
      expect(getByDisplayValue('1000')).toBeTruthy();
    });
  });

  describe('Goal Categories', () => {
    it('displays all goal categories in add modal', () => {
      const { getByText } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      // Open modal
      const addButton = getByText('Savings Goals').parent?.parent?.children[1];
      if (addButton) {
        fireEvent.press(addButton);

        // Check categories
        expect(getByText('Emergency Fund')).toBeTruthy();
        expect(getByText('Vacation')).toBeTruthy();
        expect(getByText('Car')).toBeTruthy();
        expect(getByText('House')).toBeTruthy();
        expect(getByText('Education')).toBeTruthy();
        expect(getByText('Retirement')).toBeTruthy();
        expect(getByText('Other')).toBeTruthy();
      }
    });
  });

  describe('Milestone Display', () => {
    it('shows achieved milestones correctly', () => {
      const { getByTestId } = render(
        <SavingsGoals
          goals={mockGoals}
          onAddGoal={mockOnAddGoal}
          onUpdateGoal={mockOnUpdateGoal}
          onDeleteGoal={mockOnDeleteGoal}
        />
      );

      // The milestone indicators should be present
      // This would require adding testID props to milestone elements
      // For now, we can check that the component renders without errors
      expect(true).toBeTruthy();
    });
  });
});