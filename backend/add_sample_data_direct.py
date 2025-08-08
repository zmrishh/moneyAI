#!/usr/bin/env python3
"""
Add sample data directly to Supabase without API calls
"""

from config import supabase_client
import logging
from datetime import datetime, date, timedelta
import uuid

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def add_categories():
    """Add sample categories"""
    logger.info("📝 Adding sample categories...")
    
    user_id = 'dcfb4ee7-6693-4c95-872f-a69b1383c976'
    
    categories = [
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'name': 'Food & Dining', 'type': 'expense', 'created_at': datetime.utcnow().isoformat()},
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'name': 'Transportation', 'type': 'expense', 'created_at': datetime.utcnow().isoformat()},
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'name': 'Entertainment', 'type': 'expense', 'created_at': datetime.utcnow().isoformat()},
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'name': 'Healthcare', 'type': 'expense', 'created_at': datetime.utcnow().isoformat()},
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'name': 'Shopping', 'type': 'expense', 'created_at': datetime.utcnow().isoformat()},
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'name': 'Salary', 'type': 'income', 'created_at': datetime.utcnow().isoformat()},
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'name': 'Freelance', 'type': 'income', 'created_at': datetime.utcnow().isoformat()},
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'name': 'Investments', 'type': 'income', 'created_at': datetime.utcnow().isoformat()}
    ]
    
    try:
        result = supabase_client.table('categories').insert(categories).execute()
        logger.info(f"✅ Added {len(result.data)} categories")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to add categories: {str(e)}")
        return False

def add_comprehensive_sample_data():
    """Add comprehensive sample data for testing"""
    logger.info("🚀 Adding comprehensive sample data...")
    
    user_id = 'dcfb4ee7-6693-4c95-872f-a69b1383c976'
    
    # Transactions
    transactions = []
    for i in range(10):
        transactions.append({
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'amount': 100.00 + (i * 50),
            'description': f'Sample Transaction {i+1}',
            'category_name': 'Food & Dining' if i % 2 == 0 else 'Transportation',
            'transaction_type': 'expense' if i % 3 != 0 else 'income',
            'source': 'manual',
            'date': (datetime.now() - timedelta(days=i)).isoformat(),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        })
    
    # Goals with milestones
    goal_id = str(uuid.uuid4())
    goals = [{
        'id': goal_id,
        'user_id': user_id,
        'title': 'Vacation Fund',
        'description': 'Save for summer vacation',
        'target_amount': 30000.00,
        'current_amount': 8000.00,
        'target_date': (date.today() + timedelta(days=120)).isoformat(),
        'goal_type': 'savings',
        'priority': 'medium',
        'category': 'Travel',
        'is_completed': False,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }]
    
    # Milestones for the goal
    milestones = [
        {
            'id': str(uuid.uuid4()),
            'goal_id': goal_id,
            'user_id': user_id,
            'percentage': 25,
            'amount': 7500.00,
            'achieved': True,
            'achieved_date': datetime.utcnow().isoformat(),
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'goal_id': goal_id,
            'user_id': user_id,
            'percentage': 50,
            'amount': 15000.00,
            'achieved': False,
            'created_at': datetime.utcnow().isoformat()
        }
    ]
    
    try:
        # Insert transactions
        trans_result = supabase_client.table('transactions').insert(transactions).execute()
        logger.info(f"✅ Added {len(trans_result.data)} transactions")
        
        # Insert goals
        goals_result = supabase_client.table('goals').insert(goals).execute()
        logger.info(f"✅ Added {len(goals_result.data)} goals")
        
        # Insert milestones
        milestones_result = supabase_client.table('milestones').insert(milestones).execute()
        logger.info(f"✅ Added {len(milestones_result.data)} milestones")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to add comprehensive data: {str(e)}")
        return False

def main():
    """Main function to add all sample data"""
    logger.info("🚀 Starting direct sample data addition...")
    
    operations = [
        ("Categories", add_categories),
        ("Comprehensive Data", add_comprehensive_sample_data)
    ]
    
    success_count = 0
    for name, operation in operations:
        logger.info(f"📋 Running {name}...")
        if operation():
            success_count += 1
        else:
            logger.error(f"❌ {name} failed")
    
    total = len(operations)
    logger.info(f"📊 Direct sample data addition: {success_count}/{total} operations successful")
    
    if success_count == total:
        logger.info("🎉 All direct sample data added successfully!")
        return True
    else:
        logger.error("❌ Some direct sample data operations failed")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)