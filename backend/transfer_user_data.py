#!/usr/bin/env python3
"""
Transfer user data from one user to another in MoneyAI database
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
        logging.FileHandler(f'data_transfer_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)
logger = logging.getLogger(__name__)

def get_user_id_by_email(email):
    """Get user ID by email"""
    try:
        result = supabase_client.table('users').select('id, email').eq('email', email).execute()
        if result.data:
            return result.data[0]['id']
        else:
            logger.error(f"User not found: {email}")
            return None
    except Exception as e:
        logger.error(f"Error finding user {email}: {str(e)}")
        return None

def get_user_data_counts(user_id):
    """Get counts of data for a user"""
    tables_to_check = [
        'transactions',
        'budgets', 
        'goals',
        'bills',
        'debts',
        'subscriptions'
    ]
    
    counts = {}
    for table in tables_to_check:
        try:
            result = supabase_client.table(table).select('id').eq('user_id', user_id).execute()
            counts[table] = len(result.data) if result.data else 0
        except Exception as e:
            logger.warning(f"Could not get count for table {table}: {str(e)}")
            counts[table] = 0
    
    return counts

def transfer_table_data(table_name, source_user_id, target_user_id):
    """Transfer data from source user to target user for a specific table"""
    try:
        # Update all records for the source user to point to target user
        result = supabase_client.table(table_name).update({
            'user_id': target_user_id,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('user_id', source_user_id).execute()
        
        if result.data:
            logger.info(f"✅ Transferred {len(result.data)} records from {table_name}")
            return len(result.data)
        else:
            logger.info(f"📋 No data found in {table_name} for source user")
            return 0
            
    except Exception as e:
        logger.error(f"❌ Error transferring {table_name}: {str(e)}")
        return -1

def transfer_user_data(source_email, target_email):
    """Transfer all data from source user to target user"""
    logger.info(f"🔄 Starting data transfer from {source_email} to {target_email}")
    
    # Get user IDs
    source_user_id = get_user_id_by_email(source_email)
    target_user_id = get_user_id_by_email(target_email)
    
    if not source_user_id:
        logger.error(f"❌ Source user not found: {source_email}")
        return False
    
    if not target_user_id:
        logger.error(f"❌ Target user not found: {target_email}")
        return False
    
    logger.info(f"📋 Source user ID: {source_user_id}")
    logger.info(f"📋 Target user ID: {target_user_id}")
    
    # Get data counts before transfer
    source_counts_before = get_user_data_counts(source_user_id)
    target_counts_before = get_user_data_counts(target_user_id)
    
    logger.info("📊 Data counts BEFORE transfer:")
    logger.info(f"Source user ({source_email}): {source_counts_before}")
    logger.info(f"Target user ({target_email}): {target_counts_before}")
    
    # Tables to transfer
    tables_to_transfer = [
        'transactions',
        'budgets',
        'goals', 
        'bills',
        'debts',
        'subscriptions'
    ]
    
    # Perform transfer
    total_transferred = 0
    for table in tables_to_transfer:
        logger.info(f"🔄 Transferring data from {table}...")
        transferred_count = transfer_table_data(table, source_user_id, target_user_id)
        
        if transferred_count == -1:
            logger.error(f"❌ Transfer failed for {table} - stopping process")
            return False
        
        total_transferred += transferred_count
    
    # Verify transfer results
    source_counts_after = get_user_data_counts(source_user_id)
    target_counts_after = get_user_data_counts(target_user_id)
    
    logger.info("📊 Data counts AFTER transfer:")
    logger.info(f"Source user ({source_email}): {source_counts_after}")
    logger.info(f"Target user ({target_email}): {target_counts_after}")
    
    # Verify all source data was moved
    total_source_remaining = sum(source_counts_after.values())
    if total_source_remaining > 0:
        logger.warning(f"⚠️ {total_source_remaining} records still remain with source user")
    else:
        logger.info("✅ All data successfully transferred from source user")
    
    logger.info(f"🎉 Transfer completed! {total_transferred} total records moved from {source_email} to {target_email}")
    return True

if __name__ == "__main__":
    print("=" * 80)
    print("🔄 MoneyAI Data Transfer Tool")
    print("=" * 80)
    
    SOURCE_EMAIL = "danieldaskonarapu@gmail.com"
    TARGET_EMAIL = "kenesislabs@gmail.com"
    
    print(f"📧 From: {SOURCE_EMAIL}")
    print(f"📧 To:   {TARGET_EMAIL}")
    print("=" * 80)
    
    success = transfer_user_data(SOURCE_EMAIL, TARGET_EMAIL)
    
    if success:
        print("✅ Data transfer completed successfully!")
        print(f"🎉 All user data moved from {SOURCE_EMAIL} to {TARGET_EMAIL}")
    else:
        print("❌ Data transfer failed - check logs for details")
        exit(1)