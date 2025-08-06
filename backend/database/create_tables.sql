-- MoneyAI Database Schema for Supabase
-- This file contains all table definitions for the MoneyAI application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE transaction_source AS ENUM ('manual', 'sms', 'receipt', 'auto', 'import');
CREATE TYPE budget_period AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE goal_type AS ENUM ('savings', 'debt_payoff', 'investment', 'emergency_fund');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE auto_save_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE recurrence_pattern AS ENUM ('monthly', 'quarterly', 'yearly');
CREATE TYPE debt_type AS ENUM ('owe', 'owed');
CREATE TYPE billing_cycle AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(120) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    phone VARCHAR(20),
    country_code VARCHAR(5) DEFAULT 'IN',
    currency VARCHAR(3) DEFAULT 'INR',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color
    parent_id UUID REFERENCES categories(id),
    is_system BOOLEAN DEFAULT FALSE, -- System vs user-created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id),
    category_name VARCHAR(100) NOT NULL, -- Denormalized for faster queries
    transaction_type transaction_type NOT NULL,
    source transaction_source DEFAULT 'manual',
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    merchant VARCHAR(255),
    notes TEXT,
    tags JSONB, -- Array of tags
    receipt_url VARCHAR(255),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_id UUID, -- Links to recurring transaction template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES categories(id),
    amount DECIMAL(12, 2) NOT NULL,
    spent_amount DECIMAL(12, 2) DEFAULT 0,
    period budget_period NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    alert_threshold INTEGER DEFAULT 80, -- Alert at 80% of budget
    color VARCHAR(7), -- Hex color
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table
CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0,
    target_date DATE,
    goal_type goal_type DEFAULT 'savings',
    priority goal_priority DEFAULT 'medium',
    category VARCHAR(100),
    auto_save_amount DECIMAL(12, 2),
    auto_save_frequency auto_save_frequency,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones table
CREATE TABLE public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
    percentage INTEGER NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    achieved BOOLEAN DEFAULT FALSE,
    achieved_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills table
CREATE TABLE public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(200) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern recurrence_pattern,
    is_paid BOOLEAN DEFAULT FALSE,
    payment_date TIMESTAMP WITH TIME ZONE,
    late_fee DECIMAL(12, 2),
    auto_pay BOOLEAN DEFAULT FALSE,
    reminder_days INTEGER DEFAULT 3, -- Days before due date to remind
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Debts table
CREATE TABLE public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    debt_type debt_type NOT NULL,
    person_name VARCHAR(200) NOT NULL,
    person_contact VARCHAR(100),
    amount DECIMAL(12, 2) NOT NULL,
    original_amount DECIMAL(12, 2) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE,
    created_date DATE NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE,
    settled_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Debt payments table
CREATE TABLE public.debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(200) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    billing_cycle billing_cycle NOT NULL,
    next_billing_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    auto_renew BOOLEAN DEFAULT TRUE,
    reminder_days INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price changes table
CREATE TABLE public.price_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE NOT NULL,
    old_amount DECIMAL(12, 2) NOT NULL,
    new_amount DECIMAL(12, 2) NOT NULL,
    change_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- AI interactions table
CREATE TABLE public.ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    intent VARCHAR(100), -- transaction, balance, analysis, etc.
    confidence FLOAT,
    action_taken VARCHAR(100), -- created_transaction, provided_balance, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_name ON transactions(category_name);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_period ON budgets(period, start_date, end_date);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_session ON ai_interactions(session_id);

-- Insert default categories
INSERT INTO categories (name, icon, color, is_system) VALUES
('Food & Dining', '🍔', '#FF6B35', TRUE),
('Transportation', '🚗', '#4ECDC4', TRUE),
('Shopping', '🛍️', '#45B7D1', TRUE),
('Entertainment', '🎬', '#96CEB4', TRUE),
('Bills & Utilities', '⚡', '#FFEAA7', TRUE),
('Healthcare', '🏥', '#DDA0DD', TRUE),
('Income', '💰', '#98D8C8', TRUE),
('Savings', '🏦', '#74B9FF', TRUE),
('Investment', '📈', '#A29BFE', TRUE),
('Education', '📚', '#FD79A8', TRUE),
('Travel', '✈️', '#FDCB6E', TRUE),
('Personal Care', '💅', '#E17055', TRUE),
('Gifts & Donations', '🎁', '#00B894', TRUE),
('Insurance', '🛡️', '#6C5CE7', TRUE),
('Taxes', '📋', '#2D3436', TRUE);

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Budgets policies
CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Goals policies
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Bills policies
CREATE POLICY "Users can view own bills" ON bills FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can insert own bills" ON bills FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own bills" ON bills FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own bills" ON bills FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Debts policies
CREATE POLICY "Users can view own debts" ON debts FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can insert own debts" ON debts FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own debts" ON debts FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own debts" ON debts FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own subscriptions" ON subscriptions FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));


-- AI interactions policies
CREATE POLICY "Users can view own ai_interactions" ON ai_interactions FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can insert own ai_interactions" ON ai_interactions FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Categories are public (read-only for users)
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (TRUE);

-- Milestones inherit from goals
CREATE POLICY "Users can view own milestones" ON milestones FOR SELECT USING (goal_id IN (SELECT id FROM goals WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));
CREATE POLICY "Users can insert own milestones" ON milestones FOR INSERT WITH CHECK (goal_id IN (SELECT id FROM goals WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));
CREATE POLICY "Users can update own milestones" ON milestones FOR UPDATE USING (goal_id IN (SELECT id FROM goals WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));
CREATE POLICY "Users can delete own milestones" ON milestones FOR DELETE USING (goal_id IN (SELECT id FROM goals WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));

-- Debt payments inherit from debts
CREATE POLICY "Users can view own debt_payments" ON debt_payments FOR SELECT USING (debt_id IN (SELECT id FROM debts WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));
CREATE POLICY "Users can insert own debt_payments" ON debt_payments FOR INSERT WITH CHECK (debt_id IN (SELECT id FROM debts WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));
CREATE POLICY "Users can update own debt_payments" ON debt_payments FOR UPDATE USING (debt_id IN (SELECT id FROM debts WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));
CREATE POLICY "Users can delete own debt_payments" ON debt_payments FOR DELETE USING (debt_id IN (SELECT id FROM debts WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));

-- Price changes inherit from subscriptions
CREATE POLICY "Users can view own price_changes" ON price_changes FOR SELECT USING (subscription_id IN (SELECT id FROM subscriptions WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));
CREATE POLICY "Users can insert own price_changes" ON price_changes FOR INSERT WITH CHECK (subscription_id IN (SELECT id FROM subscriptions WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();