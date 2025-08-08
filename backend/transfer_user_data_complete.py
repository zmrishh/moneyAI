#!/usr/bin/env python3
"""
Complete user data transfer script that handles ALL tables with proper user isolation
This includes the newly fixed tables: debt_payments, categories, milestones, price_changes

IMPORTANT: Run this ONLY after executing the SQL migration script to add user_id columns
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
        logging.FileHandler(f'complete_data_transfer_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
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

def get_complete_user_data_counts(user_id):
    """Get counts of data for a user across ALL tables including newly fixed ones"""
    tables_to_check = [
        'transactions',
        'budgets', 
        'goals',
        'bills',
        'debts',
        'debt_payments',    # Now has user_id
        'subscriptions',
        'price_changes',    # Now has user_id
        'milestones'        # Now has user_id
        # Note: categories excluded as they can be global (user_id NULL)
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

def transfer_table_data_safe(table_name, source_user_id, target_user_id):
    """Safely transfer data with additional validation"""
    try:
        # Get all records for source user
        source_data = supabase_client.table(table_name).select('*').eq('user_id', source_user_id).execute()
        
        if not source_data.data:
            logger.info(f"No data found in {table_name} for source user")
            return True
        
        logger.info(f"Found {len(source_data.data)} records in {table_name} to transfer")
        
        # Validate that all records actually belong to source user
        for record in source_data.data:
            if record.get('user_id') != source_user_id:
                logger.error(f"❌ Data integrity issue in {table_name}: Record {record.get('id')} belongs to different user")
                return False
        
        # Update all records to point to target user
        update_result = supabase_client.table(table_name).update({
            'user_id': target_user_id,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('user_id', source_user_id).execute()
        
        if update_result.data and len(update_result.data) == len(source_data.data):
            logger.info(f"✅ Successfully transferred {len(update_result.data)} records from {table_name}")
            return True
        else:
            logger.error(f"❌ Transfer mismatch in {table_name}: Expected {len(source_data.data)}, got {len(update_result.data) if update_result.data else 0}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error transferring {table_name}: {str(e)}")
        return False

def handle_related_data_transfer(source_user_id, target_user_id):
    """Handle transfer of related data that depends on parent records"""
    logger.info("🔗 Handling related data transfers...")
    
    # These tables have relationships and should be transferred after their parent tables
    related_tables = [
        'debt_payments',    # Depends on debts
        'price_changes',    # Depends on subscriptions  
        'milestones'        # Depends on goals
    ]
    
    for table in related_tables:
        logger.info(f"🔄 Transferring related data from {table}...")
        success = transfer_table_data_safe(table, source_user_id, target_user_id)
        if not success:
            logger.error(f"❌ Failed to transfer related data from {table}")
            return False
    
    return True

def transfer_complete_user_data(source_email, target_email):
    """Complete user data transfer including all tables"""
    logger.info(f"🔄 Starting COMPLETE data transfer from {source_email} to {target_email}")
    
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
    
    # Get complete data counts before transfer
    source_counts_before = get_complete_user_data_counts(source_user_id)
    target_counts_before = get_complete_user_data_counts(target_user_id)
    
    logger.info("📊 COMPLETE data counts BEFORE transfer:")
    logger.info(f"Source user ({source_email}): {source_counts_before}")
    logger.info(f"Target user ({target_email}): {target_counts_before}")
    
    # Primary tables to transfer first (no dependencies)
    primary_tables = [
        'transactions',
        'budgets',
        'goals',
        'bills', 
        'debts',
        'subscriptions'
    ]
    
    # Transfer primary tables first
    logger.info("📋 Phase 1: Transferring primary tables...")
    for table in primary_tables:
        logger.info(f"🔄 Transferring data from {table}...")
        success = transfer_table_data_safe(table, source_user_id, target_user_id)
        
        if not success:
            logger.error(f"❌ Transfer failed for {table} - stopping process")
            return False
    
    # Transfer related tables second
    logger.info("📋 Phase 2: Transferring related tables...")
    success = handle_related_data_transfer(source_user_id, target_user_id)
    if not success:
        logger.error("❌ Related data transfer failed - stopping process")
        return False
    
    # Verify complete transfer results
    source_counts_after = get_complete_user_data_counts(source_user_id)
    target_counts_after = get_complete_user_data_counts(target_user_id)
    
    logger.info("📊 COMPLETE data counts AFTER transfer:")
    logger.info(f"Source user ({source_email}): {source_counts_after}")
    logger.info(f"Target user ({target_email}): {target_counts_after}")
    
    # Verify all source data was moved
    total_source_remaining = sum(source_counts_after.values())
    if total_source_remaining > 0:
        logger.warning(f"⚠️ {total_source_remaining} records still remain with source user")
    else:
        logger.info("✅ All data successfully transferred from source user")
    
    # Calculate total transferred
    total_transferred = sum(source_counts_before.values())
    total_received = sum(target_counts_after.values()) - sum(target_counts_before.values())
    
    logger.info(f"📊 Transfer Summary:")
    logger.info(f"   📤 Records moved from source: {total_transferred}")
    logger.info(f"   📥 Records received by target: {total_received}")
    logger.info(f"   ✅ Transfer integrity: {'PASS' if total_transferred == total_received else 'FAIL'}")
    
    if total_transferred == total_received:
        logger.info(f"🎉 COMPLETE transfer successful! {total_transferred} total records moved from {source_email} to {target_email}")
        return True
    else:
        logger.error(f"❌ Transfer integrity check failed!")
        return False

def verify_data_isolation():
    """Verify that user data is properly isolated after migration"""
    logger.info("🔍 Verifying data isolation after transfer...")
    
    # Check for any orphaned records
    tables_to_verify = [
        'debt_payments',
        'price_changes', 
        'milestones'
    ]
    
    for table in tables_to_verify:
        try:
            # Check for records with NULL user_id (should not exist after migration)
            null_user_records = supabase_client.table(table).select('id').is_('user_id', 'null').execute()
            null_count = len(null_user_records.data) if null_user_records.data else 0
            
            if null_count > 0:
                logger.warning(f"⚠️ Found {null_count} records in {table} with NULL user_id")
            else:
                logger.info(f"✅ {table}: All records have proper user_id")
                
        except Exception as e:
            logger.error(f"❌ Error verifying {table}: {str(e)}")

if __name__ == "__main__":
    print("=" * 80)
    print("🔄 MoneyAI COMPLETE Data Transfer Tool")
    print("⚠️  REQUIRES: SQL migration must be executed first!")
    print("=" * 80)
    
    SOURCE_EMAIL = "danieldaskonarapu@gmail.com"
    TARGET_EMAIL = "kenesislabs@gmail.com"
    
    print(f"📧 From: {SOURCE_EMAIL}")
    print(f"📧 To:   {TARGET_EMAIL}")
    print("=" * 80)
    print("🚀 Starting complete transfer process...")
    
    # Execute complete transfer
    success = transfer_complete_user_data(SOURCE_EMAIL, TARGET_EMAIL)
    
    if success:
        print("✅ COMPLETE data transfer successful!")
        print(f"🎉 ALL user data moved from {SOURCE_EMAIL} to {TARGET_EMAIL}")
        
        # Verify isolation
        verify_data_isolation()
        
    else:
        print("❌ Complete data transfer failed - check logs for details")
        exit(1)