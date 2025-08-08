#!/usr/bin/env python3
"""
Verify that the database migration was successful
"""

from config import supabase_client
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def verify_migration():
    """Verify that user_id columns were added successfully"""
    logger.info("🔍 Verifying database migration...")
    
    tables_to_check = ['debt_payments', 'categories', 'milestones', 'price_changes']
    
    for table in tables_to_check:
        try:
            # Try to select a record with user_id column
            result = supabase_client.table(table).select('*').limit(1).execute()
            
            if result.data and len(result.data) > 0:
                columns = list(result.data[0].keys())
                has_user_id = 'user_id' in columns
                logger.info(f"✅ {table}: {'HAS user_id' if has_user_id else '❌ MISSING user_id'}")
            else:
                # Table exists but no data - try to insert test record to verify schema
                logger.info(f"📋 {table}: Table exists but no data to verify schema")
                
        except Exception as e:
            logger.error(f"❌ Error checking {table}: {str(e)}")

if __name__ == "__main__":
    verify_migration()