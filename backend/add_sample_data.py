#!/usr/bin/env python3
"""
Add sample data to the MoneyAI database for testing
"""

from config import supabase_client
import logging
from datetime import datetime, date, timedelta
import uuid

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def add_sample_transactions():
    """Add sample transactions"""
    logger.info("📝 Adding sample transactions...")
    
    user_id = 'dcfb4ee7-6693-4c95-872f-a69b1383c976'  # kenesislabs@gmail.com
    
    transactions = [
        {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'amount': 5000.00,
            'description': 'Salary Payment',
            'category_name': 'Income',
            'transaction_type': 'income',
            'source': 'manual',
            'date': (datetime.now() - timedelta(days=1)).isoformat(),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'amount': 150.00,
            'description': 'Grocery Shopping',
            'category_name': 'Food & Dining',
            'transaction_type': 'expense',
            'source': 'manual',
            'date': datetime.now().isoformat(),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'amount': 50.00,
            'description': 'Coffee Shop',
            'category_name': 'Food & Dining',
            'transaction_type': 'expense',
            'source': 'manual',
            'date': datetime.now().isoformat(),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
    ]
    
    try:
        result = supabase_client.table('transactions').insert(transactions).execute()
        logger.info(f"✅ Added {len(result.data)} sample transactions")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to add transactions: {str(e)}")
        return False

def add_sample_goals():
    """Add sample goals"""
    logger.info("📝 Adding sample goals...")
    
    user_id = 'dcfb4ee7-6693-4c95-872f-a69b1383c976'
    
    goals = [
        {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'title': 'Emergency Fund',
            'description': 'Build emergency fund for 6 months expenses',
            'target_amount': 50000.00,
            'current_amount': 15000.00,
            'target_date': (date.today() + timedelta(days=365)).isoformat(),
            'goal_type': 'savings',
            'priority': 'high',
            'category': 'Emergency',
            'is_completed': False,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
    ]
    
    try:
        result = supabase_client.table('goals').insert(goals).execute()
        logger.info(f"✅ Added {len(result.data)} sample goals")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to add goals: {str(e)}")
        return False

def add_sample_debts():
    """Add sample debts"""
    logger.info("📝 Adding sample debts...")
    
    user_id = 'dcfb4ee7-6693-4c95-872f-a69b1383c976'
    
    debts = [
        {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'debt_type': 'owe',
            'person_name': 'John Smith',
            'person_contact': 'john@example.com',
            'amount': 2000.00,
            'original_amount': 2500.00,
            'description': 'Personal loan for car repair',
            'due_date': (date.today() + timedelta(days=30)).isoformat(),
            'created_date': date.today().isoformat(),
            'is_settled': False,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
    ]
    
    try:
        result = supabase_client.table('debts').insert(debts).execute()
        logger.info(f"✅ Added {len(result.data)} sample debts")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to add debts: {str(e)}")
        return False

def main():
    """Add all sample data"""
    logger.info("🚀 Starting to add sample data...")
    
    success_count = 0
    total_operations = 3
    
    if add_sample_transactions():
        success_count += 1
    
    if add_sample_goals():
        success_count += 1
        
    if add_sample_debts():
        success_count += 1
    
    logger.info(f"📊 Sample data addition completed: {success_count}/{total_operations} operations successful")
    
    if success_count == total_operations:
        logger.info("🎉 All sample data added successfully!")
        return True
    else:
        logger.error("❌ Some sample data operations failed")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)