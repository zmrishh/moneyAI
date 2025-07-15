export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  type: 'income' | 'expense';
  source: 'manual' | 'sms' | 'receipt' | 'auto';
  location?: string;
  tags?: string[];
  receipt_image?: string;
  merchant?: string;
  is_recurring?: boolean;
  subscription_id?: string;
  split_group_id?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
  parent_id?: string;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: Date;
  end_date?: Date;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: Date;
  category_id?: string;
  type: 'savings' | 'debt_payoff' | 'investment' | 'emergency_fund';
}

export interface Insight {
  id: string;
  type: 'spending_pattern' | 'budget_alert' | 'saving_opportunity' | 'goal_progress';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  action_suggestion?: string;
  created_at: Date;
}

// New interfaces for essential features
export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_billing_date: Date;
  category: string;
  is_active: boolean;
  auto_renew: boolean;
  price_changes: PriceChange[];
  created_at: Date;
}

export interface PriceChange {
  id: string;
  old_amount: number;
  new_amount: number;
  change_date: Date;
  reason?: string;
}

export interface Debt {
  id: string;
  type: 'owe' | 'owed';
  person_name: string;
  person_contact?: string;
  amount: number;
  original_amount: number;
  description: string;
  due_date?: Date;
  created_date: Date;
  payments: DebtPayment[];
  is_settled: boolean;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: Date;
  note?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  due_date: Date;
  category: string;
  is_recurring: boolean;
  recurrence_pattern?: 'monthly' | 'quarterly' | 'yearly';
  is_paid: boolean;
  payment_date?: Date;
  late_fee?: number;
  auto_pay: boolean;
}

export interface SavingsGoal extends Goal {
  type: 'savings';
  monthly_target?: number;
  auto_save_amount?: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  percentage: number;
  amount: number;
  achieved: boolean;
  achieved_date?: Date;
}

export interface GroupExpense {
  id: string;
  name: string;
  total_amount: number;
  created_by: string;
  participants: Participant[];
  expenses: GroupExpenseItem[];
  settlements: Settlement[];
  is_settled: boolean;
  created_date: Date;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  total_owed: number;
  total_paid: number;
}

export interface GroupExpenseItem {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_type: 'equal' | 'exact' | 'percentage';
  split_details: { [participant_id: string]: number };
  date: Date;
}

export interface Settlement {
  id: string;
  from_participant: string;
  to_participant: string;
  amount: number;
  is_completed: boolean;
  completed_date?: Date;
}

export interface FinancialHealth {
  score: number; // 0-100
  factors: {
    emergency_fund: number;
    debt_to_income: number;
    savings_rate: number;
    spending_consistency: number;
    budget_adherence: number;
  };
  recommendations: string[];
  last_calculated: Date;
}

export interface Investment {
  id: string;
  name: string;
  type: 'stock' | 'crypto' | 'mutual_fund' | 'real_estate' | 'other';
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: Date;
  platform?: string;
}