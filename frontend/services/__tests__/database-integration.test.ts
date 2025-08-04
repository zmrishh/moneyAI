import { dbService } from '../database';
import { Bill, Debt, Subscription } from '@/types';

// Mock SQLite for testing
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    execAsync: jest.fn(() => Promise.resolve()),
    runAsync: jest.fn(() => Promise.resolve()),
    getAllAsync: jest.fn(() => Promise.resolve([])),
    getFirstAsync: jest.fn(() => Promise.resolve(null)),
  })),
}));

describe('Database Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bills Integration', () => {
    it('should add a bill successfully', async () => {
      const mockBill: Omit<Bill, 'id'> = {
        name: 'Test Bill',
        amount: 100,
        due_date: new Date(),
        category: 'Utilities',
        is_recurring: true,
        recurrence_pattern: 'monthly',
        is_paid: false,
        auto_pay: false,
      };

      await dbService.initialize();
      const billId = await dbService.addBill(mockBill);
      
      expect(billId).toBeDefined();
      expect(typeof billId).toBe('string');
    });

    it('should get bills successfully', async () => {
      await dbService.initialize();
      const bills = await dbService.getBills();
      
      expect(Array.isArray(bills)).toBe(true);
    });
  });

  describe('Debts Integration', () => {
    it('should add a debt successfully', async () => {
      const mockDebt: Omit<Debt, 'id' | 'payments' | 'created_date'> = {
        type: 'owe',
        person_name: 'John Doe',
        amount: 500,
        original_amount: 500,
        description: 'Lunch money',
        is_settled: false,
      };

      await dbService.initialize();
      const debtId = await dbService.addDebt({
        ...mockDebt,
        created_date: new Date(),
      });
      
      expect(debtId).toBeDefined();
      expect(typeof debtId).toBe('string');
    });

    it('should get debts successfully', async () => {
      await dbService.initialize();
      const debts = await dbService.getDebts();
      
      expect(Array.isArray(debts)).toBe(true);
    });
  });

  describe('Subscriptions Integration', () => {
    it('should add a subscription successfully', async () => {
      const mockSubscription: Omit<Subscription, 'id' | 'price_changes'> = {
        name: 'Netflix',
        amount: 799,
        billing_cycle: 'monthly',
        next_billing_date: new Date(),
        category: 'Entertainment',
        is_active: true,
        auto_renew: true,
        created_at: new Date(),
      };

      await dbService.initialize();
      const subscriptionId = await dbService.addSubscription(mockSubscription);
      
      expect(subscriptionId).toBeDefined();
      expect(typeof subscriptionId).toBe('string');
    });

    it('should get subscriptions successfully', async () => {
      await dbService.initialize();
      const subscriptions = await dbService.getSubscriptions();
      
      expect(Array.isArray(subscriptions)).toBe(true);
    });
  });
});