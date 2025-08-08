#!/usr/bin/env python3
"""
Execute the database migration using direct operations
"""

from config import supabase_client
import logging

# Enable detailed logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_existing_categories():
    """Update existing categories to assign to specific user"""
    logger.info("🔄 Updating existing categories to assign to user...")
    
    target_user_id = 'dcfb4ee7-6693-4c95-872f-a69b1383c976'
    
    try:
        # First, get all categories where user_id is NULL
        categories_result = supabase_client.table('categories').select('*').is_('user_id', 'null').execute()
        
        if categories_result.data:
            logger.info(f"Found {len(categories_result.data)} categories with NULL user_id")
            
            # Update each category individually
            for category in categories_result.data:
                result = supabase_client.table('categories').update({
                    'user_id': target_user_id
                }).eq('id', category['id']).execute()
                
                if result.data:
                    logger.info(f"✅ Updated category: {category.get('name', category['id'])}")
                else:
                    logger.error(f"❌ Failed to update category: {category.get('name', category['id'])}")
        else:
            logger.info("ℹ️ No categories found with NULL user_id")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to update categories: {str(e)}")
        return False

def verify_migration_results():
    """Verify the migration results"""
    logger.info("🔍 Verifying migration results...")
    
    tables_to_check = ['debt_payments', 'categories', 'milestones', 'price_changes']
    
    for table in tables_to_check:
        try:
            # Try to get a sample record to see if user_id column exists
            result = supabase_client.table(table).select('id, user_id').limit(1).execute()
            
            if result.data:
                if 'user_id' in result.data[0]:
                    logger.info(f"✅ {table}: user_id column exists")
                else:
                    logger.error(f"❌ {table}: user_id column missing")
            else:
                # Check structure by trying to query with user_id
                try:
                    supabase_client.table(table).select('user_id').limit(1).execute()
                    logger.info(f"✅ {table}: user_id column exists (no data)")
                except:
                    logger.error(f"❌ {table}: user_id column missing")
                    
        except Exception as e:
            logger.error(f"❌ Error checking {table}: {str(e)}")

if __name__ == "__main__":
    logger.info("🚀 Starting migration verification and categories update...")
    
    # First verify current state
    verify_migration_results()
    
    # Update categories
    success = update_existing_categories()
    
    if success:
        logger.info("🎉 Migration steps completed successfully!")
        # Verify again
        verify_migration_results()
    else:
        logger.error("❌ Migration failed")
        exit(1)