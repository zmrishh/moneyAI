-- Migration: Fix User Data Isolation
-- Date: 2025-08-08T03:21:28.891850
-- Purpose: Add user_id columns and proper foreign key relationships

-- 1. ADD USER_ID TO DEBT_PAYMENTS TABLE
-- debt_payments should be linked to user via debt_id -> debts.user_id
ALTER TABLE debt_payments 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Update existing debt_payments to have proper user_id
UPDATE debt_payments 
SET user_id = (
    SELECT debts.user_id 
    FROM debts 
    WHERE debts.id = debt_payments.debt_id
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after data migration
ALTER TABLE debt_payments 
ALTER COLUMN user_id SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_debt_payments_user_id ON debt_payments(user_id);

-- 2. ADD USER_ID TO CATEGORIES TABLE
-- categories should have user_id for user-specific categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Update existing categories to belong to kenesislabs@gmail.com
UPDATE categories 
SET user_id = 'dcfb4ee7-6693-4c95-872f-a69b1383c976'
WHERE user_id IS NULL;

-- Make user_id NOT NULL after data migration
ALTER TABLE categories 
ALTER COLUMN user_id SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- 3. ADD USER_ID TO MILESTONES TABLE  
-- milestones should be linked to user via goal_id -> goals.user_id
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Update existing milestones to have proper user_id
UPDATE milestones 
SET user_id = (
    SELECT goals.user_id 
    FROM goals 
    WHERE goals.id = milestones.goal_id
)
WHERE user_id IS NULL AND goal_id IS NOT NULL;

-- Make user_id NOT NULL after data migration
ALTER TABLE milestones 
ALTER COLUMN user_id SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);

-- 4. ADD USER_ID TO PRICE_CHANGES TABLE
-- price_changes should be linked to user via subscription_id -> subscriptions.user_id
ALTER TABLE price_changes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Update existing price_changes to have proper user_id
UPDATE price_changes 
SET user_id = (
    SELECT subscriptions.user_id 
    FROM subscriptions 
    WHERE subscriptions.id = price_changes.subscription_id
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after data migration
ALTER TABLE price_changes 
ALTER COLUMN user_id SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_price_changes_user_id ON price_changes(user_id);

-- 5. UPDATE ROW LEVEL SECURITY POLICIES
-- Enable RLS on all tables
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;  
ALTER TABLE price_changes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for debt_payments
DROP POLICY IF EXISTS "Users can access their own debt_payments" ON debt_payments;
CREATE POLICY "Users can access their own debt_payments" ON debt_payments
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for categories (allow both user-specific and global)
DROP POLICY IF EXISTS "Users can access categories" ON categories;
CREATE POLICY "Users can access categories" ON categories
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS policies for milestones
DROP POLICY IF EXISTS "Users can access their own milestones" ON milestones;
CREATE POLICY "Users can access their own milestones" ON milestones
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for price_changes
DROP POLICY IF EXISTS "Users can access their own price_changes" ON price_changes;
CREATE POLICY "Users can access their own price_changes" ON price_changes
FOR ALL USING (auth.uid() = user_id);

-- 6. CREATE TRIGGERS TO AUTO-POPULATE USER_ID
-- Trigger for debt_payments
CREATE OR REPLACE FUNCTION set_user_id_debt_payments()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL AND NEW.debt_id IS NOT NULL THEN
        NEW.user_id := (SELECT user_id FROM debts WHERE id = NEW.debt_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_user_id_debt_payments ON debt_payments;
CREATE TRIGGER trigger_set_user_id_debt_payments
    BEFORE INSERT OR UPDATE ON debt_payments
    FOR EACH ROW EXECUTE FUNCTION set_user_id_debt_payments();

-- Trigger for milestones  
CREATE OR REPLACE FUNCTION set_user_id_milestones()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL AND NEW.goal_id IS NOT NULL THEN
        NEW.user_id := (SELECT user_id FROM goals WHERE id = NEW.goal_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_user_id_milestones ON milestones;
CREATE TRIGGER trigger_set_user_id_milestones
    BEFORE INSERT OR UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION set_user_id_milestones();

-- Trigger for price_changes
CREATE OR REPLACE FUNCTION set_user_id_price_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL AND NEW.subscription_id IS NOT NULL THEN
        NEW.user_id := (SELECT user_id FROM subscriptions WHERE id = NEW.subscription_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_user_id_price_changes ON price_changes;
CREATE TRIGGER trigger_set_user_id_price_changes
    BEFORE INSERT OR UPDATE ON price_changes
    FOR EACH ROW EXECUTE FUNCTION set_user_id_price_changes();

COMMIT;