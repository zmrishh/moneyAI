#!/usr/bin/env python3
"""
Add sample data via backend API endpoints
"""

import requests
import json
import logging
from datetime import datetime, date, timedelta

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:5001/api"

def get_auth_token():
    """Get authentication token"""
    login_data = {
        "email": "kenesislabs@gmail.com",
        "password": "Test123!"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                logger.info("✅ Authentication successful")
                return data['data']['access_token']
        
        logger.error(f"❌ Authentication failed: {response.text}")
        return None
    except Exception as e:
        logger.error(f"❌ Authentication error: {str(e)}")
        return None

def add_transactions_via_api(token):
    """Add transactions via API"""
    logger.info("📝 Adding transactions via API...")
    
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    transactions = [
        {
            'amount': 7500.00,
            'description': 'Monthly Salary',
            'category_name': 'Salary',
            'transaction_type': 'income',
            'date': (datetime.now() - timedelta(days=3)).isoformat()
        },
        {
            'amount': 250.00,
            'description': 'Restaurant Dinner',
            'category_name': 'Food & Dining',
            'transaction_type': 'expense',
            'date': (datetime.now() - timedelta(days=1)).isoformat()
        },
        {
            'amount': 80.00,
            'description': 'Gas Station',
            'category_name': 'Transportation',
            'transaction_type': 'expense',
            'date': datetime.now().isoformat()
        }
    ]
    
    success_count = 0
    for trans in transactions:
        try:
            response = requests.post(f"{BASE_URL}/transactions", json=trans, headers=headers)
            if response.status_code in [200, 201]:
                success_count += 1
                logger.info(f"✅ Added transaction: {trans['description']}")
            else:
                logger.error(f"❌ Failed to add transaction {trans['description']}: {response.text}")
        except Exception as e:
            logger.error(f"❌ Error adding transaction {trans['description']}: {str(e)}")
    
    logger.info(f"📊 Added {success_count}/{len(transactions)} transactions via API")
    return success_count == len(transactions)

def add_goals_via_api(token):
    """Add goals via API"""
    logger.info("📝 Adding goals via API...")
    
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    goals = [
        {
            'title': 'Car Purchase Fund',
            'description': 'Save for a new car',
            'target_amount': 200000.00,
            'current_amount': 50000.00,
            'target_date': (date.today() + timedelta(days=300)).isoformat(),
            'goal_type': 'savings',
            'priority': 'high',
            'category': 'Transportation'
        },
        {
            'title': 'Home Renovation',
            'description': 'Kitchen and bathroom renovation',
            'target_amount': 150000.00,
            'current_amount': 25000.00,
            'target_date': (date.today() + timedelta(days=200)).isoformat(),
            'goal_type': 'savings',
            'priority': 'medium',
            'category': 'Home'
        }
    ]
    
    success_count = 0
    for goal in goals:
        try:
            response = requests.post(f"{BASE_URL}/goals", json=goal, headers=headers)
            if response.status_code in [200, 201]:
                success_count += 1
                logger.info(f"✅ Added goal: {goal['title']}")
            else:
                logger.error(f"❌ Failed to add goal {goal['title']}: {response.text}")
        except Exception as e:
            logger.error(f"❌ Error adding goal {goal['title']}: {str(e)}")
    
    logger.info(f"📊 Added {success_count}/{len(goals)} goals via API")
    return success_count == len(goals)

def add_debts_via_api(token):
    """Add debts via API"""
    logger.info("📝 Adding debts via API...")
    
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    debts = [
        {
            'debt_type': 'owe',
            'person_name': 'Mike Johnson',
            'person_contact': 'mike@example.com',
            'amount': 3000.00,
            'description': 'Borrowed for business investment',
            'due_date': (date.today() + timedelta(days=60)).isoformat(),
            'created_date': date.today().isoformat()
        },
        {
            'debt_type': 'owed',
            'person_name': 'Lisa Chen',
            'person_contact': 'lisa@example.com',
            'amount': 1200.00,
            'description': 'Consulting work payment',
            'due_date': (date.today() + timedelta(days=10)).isoformat(),
            'created_date': date.today().isoformat()
        }
    ]
    
    success_count = 0
    for debt in debts:
        try:
            response = requests.post(f"{BASE_URL}/debts", json=debt, headers=headers)
            if response.status_code in [200, 201]:
                success_count += 1
                logger.info(f"✅ Added debt: {debt['person_name']} ({debt['debt_type']})")
            else:
                logger.error(f"❌ Failed to add debt {debt['person_name']}: {response.text}")
        except Exception as e:
            logger.error(f"❌ Error adding debt {debt['person_name']}: {str(e)}")
    
    logger.info(f"📊 Added {success_count}/{len(debts)} debts via API")
    return success_count == len(debts)

def main():
    """Main function to add sample data via API"""
    logger.info("🚀 Starting sample data addition via backend API...")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        logger.error("❌ Cannot proceed without authentication token")
        return False
    
    # Add data via API endpoints
    operations = [
        ("Transactions", lambda: add_transactions_via_api(token)),
        ("Goals", lambda: add_goals_via_api(token)),
        ("Debts", lambda: add_debts_via_api(token))
    ]
    
    success_count = 0
    for name, operation in operations:
        logger.info(f"📋 Running {name} API...")
        if operation():
            success_count += 1
        else:
            logger.error(f"❌ {name} API operations failed")
    
    total = len(operations)
    logger.info(f"📊 API sample data addition: {success_count}/{total} operations successful")
    
    if success_count == total:
        logger.info("🎉 All sample data added successfully via API!")
        return True
    else:
        logger.error("❌ Some API sample data operations failed")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)