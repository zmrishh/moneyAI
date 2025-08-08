#!/usr/bin/env python3
"""
Add sample data specifically for Daniel's user account
"""

from config import supabase_client
import logging
from datetime import datetime, date, timedelta
import uuid

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def add_daniel_sample_data():
    """Add sample data for Daniel's account"""
    logger.info("📝 Adding sample data for Daniel...")
    
    # Daniel's user ID
    user_id = '4ec70b82-d56b-4458-8a9d-cc903a2244df'  # danieldaskonarapu@gmail.com
    
    # Sample transactions
    transactions = [
        {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'amount': 8000.00,
            'description': 'Monthly Salary',
            'category_name': 'Income',
            'transaction_type': 'income',
            'source': 'manual',
            'date': (datetime.now() - timedelta(days=5)).isoformat(),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'amount': 200.00,
            'description': 'Weekly Grocery Shopping',
            'category_name': 'Food & Dining',
            'transaction_type': 'expense',
            'source': 'manual',
            'date': (datetime.now() - timedelta(days=2)).isoformat(),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'amount': 1500.00,
            'description': 'Rent Payment',
            'category_name': 'Housing',
            'transaction_type': 'expense',
            'source': 'manual',
            'date': (datetime.now() - timedelta(days=1)).isoformat(),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
    ]
    
    # Sample goals
    goals = [
        {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'title': 'New Laptop Fund',
            'description': 'Save for a new MacBook Pro',
            'target_amount': 100000.00,
            'current_amount': 25000.00,
            'target_date': (date.today() + timedelta(days=180)).isoformat(),
            'goal_type': 'savings',
            'priority': 'medium',
            'category': 'Technology',
            'is_completed': False,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
    ]
    
    # Sample debts
    debts = [
        {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'debt_type': 'owed',
            'person_name': 'Sarah Wilson',
            'person_contact': 'sarah@example.com',
            'amount': 1500.00,
            'original_amount': 1500.00,
            'description': 'Freelance project payment',
            'due_date': (date.today() + timedelta(days=15)).isoformat(),
            'created_date': date.today().isoformat(),
            'is_settled': False,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
    ]
    
    try:
        # Insert transactions
        trans_result = supabase_client.table('transactions').insert(transactions).execute()
        logger.info(f"✅ Added {len(trans_result.data)} transactions for Daniel")
        
        # Insert goals
        goals_result = supabase_client.table('goals').insert(goals).execute()
        logger.info(f"✅ Added {len(goals_result.data)} goals for Daniel")
        
        # Insert debts
        debts_result = supabase_client.table('debts').insert(debts).execute()
        logger.info(f"✅ Added {len(debts_result.data)} debts for Daniel")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to add sample data for Daniel: {str(e)}")
        return False

if __name__ == "__main__":
    success = add_daniel_sample_data()
    if success:
        logger.info("🎉 Sample data for Daniel added successfully!")
    else:
        logger.error("❌ Failed to add sample data for Daniel")
        exit(1)