#!/usr/bin/env python3
"""
Fix User Data Isolation Issues in MoneyAI Database

This script identifies and fixes tables that lack proper user_id columns for data isolation:
1. debt_payments - should link to user via debt_id -> debts.user_id
2. categories - should have user_id for user-specific categories
3. milestones - should link to user via goal_id -> goals.user_id
4. price_changes - should link to user via subscription_id -> subscriptions.user_id
"""

from config import supabase_client
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f'data_isolation_fix_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)
logger = logging.getLogger(__name__)

def analyze_data_isolation_issues():
    """Analyze tables that have user isolation issues"""
    logger.info("🔍 Analyzing database for user isolation issues...")
    
    # Tables that should have user_id but might be missing it
    problematic_tables = [
        'debt_payments',
        'categories', 
        'milestones',
        'price_changes'
    ]
    
    issues = {}
    
    for table in problematic_tables:
        try:
            # Try to query for user_id column
            result = supabase_client.table(table).select('id, user_id').limit(1).execute()
            
            if result.data and len(result.data) > 0:
                sample_record = result.data[0]
                if 'user_id' not in sample_record or sample_record['user_id'] is None:
                    # Count total records without user_id
                    total_result = supabase_client.table(table).select('id').execute()
                    total_count = len(total_result.data) if total_result.data else 0
                    
                    issues[table] = {
                        'has_user_id_column': 'user_id' in sample_record,
                        'null_user_id_count': total_count if sample_record.get('user_id') is None else 0,
                        'total_records': total_count
                    }
                    logger.warning(f"⚠️ {table}: Found {total_count} records potentially missing proper user_id")
                else:
                    logger.info(f"✅ {table}: Appears to have proper user_id isolation")
            else:
                logger.info(f"📋 {table}: Empty table - will need user_id column when data is added")
                issues[table] = {'has_user_id_column': False, 'null_user_id_count': 0, 'total_records': 0}
                
        except Exception as e:
            logger.error(f"❌ Error analyzing {table}: {str(e)}")
            issues[table] = {'error': str(e)}
    
    return issues

def generate_migration_sql():
    """Generate SQL migration script to fix user isolation issues"""
    logger.info("📝 Generating migration SQL...")
    
    migration_sql = f"""
-- Migration: Fix User Data Isolation
-- Date: {datetime.now().isoformat()}
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
"""
    
    # Write migration to file
    filename = f"migration_fix_user_isolation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    with open(filename, 'w') as f:
        f.write(migration_sql)
    
    logger.info(f"📄 Migration SQL written to {filename}")
    return filename

def get_affected_tables_data_counts():
    """Get data counts for tables that will be affected"""
    logger.info("📊 Getting data counts for affected tables...")
    
    tables_to_check = [
        'users',           # Reference table
        'debts',           # Parent of debt_payments
        'goals',           # Parent of milestones  
        'subscriptions',   # Parent of price_changes
        'debt_payments',   # Now has user_id
        'categories',      # Now has user_id
        'milestones',      # Now has user_id
        'price_changes',   # Now has user_id
    ]
    
    counts = {}
    for table in tables_to_check:
        try:
            result = supabase_client.table(table).select('id').execute()
            counts[table] = len(result.data) if result.data else 0
            logger.info(f"📋 {table}: {counts[table]} records")
        except Exception as e:
            logger.warning(f"⚠️ Could not get count for {table}: {str(e)}")
            counts[table] = 'Unknown'
    
    return counts

def test_user_isolation_fix():
    """Test that user isolation is working after migration"""
    logger.info("🧪 Testing user isolation after migration...")
    
    # Test tables that should now have user_id
    tables_to_test = ['debt_payments', 'milestones', 'price_changes']
    
    for table in tables_to_test:
        try:
            # Try to query with user_id filter
            test_result = supabase_client.table(table).select('id, user_id').limit(1).execute()
            if test_result.data and len(test_result.data) > 0:
                sample = test_result.data[0]
                if 'user_id' in sample and sample['user_id'] is not None:
                    logger.info(f"✅ {table}: User isolation working - has user_id")
                else:
                    logger.warning(f"⚠️ {table}: User isolation issue - user_id is null")
            else:
                logger.info(f"📋 {table}: No data to test user isolation")
        except Exception as e:
            logger.error(f"❌ Error testing {table}: {str(e)}")

def main():
    """Main execution function"""
    logger.info("🚀 Starting User Data Isolation Fix Process")
    print("=" * 80)
    print("🔧 MoneyAI Database - User Data Isolation Fix")
    print("=" * 80)
    
    # Step 1: Analyze current issues
    logger.info("📋 Step 1: Analyzing current data isolation issues...")
    issues = analyze_data_isolation_issues()
    
    if not any(issues.values()):
        logger.info("✅ No user isolation issues found!")
        return
    
    # Step 2: Get current data counts
    logger.info("📋 Step 2: Getting current data counts...")
    counts = get_affected_tables_data_counts()
    
    # Step 3: Generate migration SQL
    logger.info("📋 Step 3: Generating migration SQL...")
    migration_file = generate_migration_sql()
    
    # Step 4: Summary and next steps
    logger.info("📋 Step 4: Summary and next steps...")
    logger.info("🎯 SUMMARY:")
    logger.info(f"   📄 Migration SQL generated: {migration_file}")
    logger.info("   🔧 Tables that need user_id fixes:")
    
    for table, issue in issues.items():
        if 'error' not in issue:
            logger.info(f"      - {table}: {issue.get('total_records', 0)} records")
    
    logger.info("\n🚀 NEXT STEPS:")
    logger.info("   1. Review the generated migration SQL file")
    logger.info("   2. Execute the migration in your database")
    logger.info("   3. Update your application code to use user_id filtering")
    logger.info("   4. Test the user isolation")
    
    logger.info("✅ User data isolation analysis completed!")

if __name__ == "__main__":
    main()