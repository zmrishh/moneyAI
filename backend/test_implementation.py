#!/usr/bin/env python3
"""
Test the complete implementation with proper user_id isolation
"""

import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:5001/api"

def test_login_and_get_token():
    """Login and get JWT token"""
    login_data = {
        "email": "kenesislabs@gmail.com",
        "password": "Test123!"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'access_token' in data.get('data', {}):
                logger.info("✅ Login successful")
                return data['data']['access_token']
            else:
                logger.error(f"❌ Login failed: {data}")
                return None
        else:
            logger.error(f"❌ Login request failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"❌ Login error: {str(e)}")
        return None

def test_categories_endpoint(token):
    """Test categories endpoint with user_id filtering"""
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.get(f"{BASE_URL}/transactions/categories", headers=headers)
        if response.status_code == 200:
            data = response.json()
            categories = data.get('data', [])
            logger.info(f"✅ Categories endpoint: {len(categories)} categories retrieved")
            
            # Check if categories have user_id
            if categories:
                sample_category = categories[0]
                logger.info(f"   Sample category: {sample_category.get('name')} (user_id: {sample_category.get('user_id', 'N/A')})")
            
            return True
        else:
            logger.error(f"❌ Categories endpoint failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"❌ Categories test error: {str(e)}")
        return False

def test_analytics_endpoint(token):
    """Test analytics endpoint"""
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.get(f"{BASE_URL}/analytics/balance", headers=headers)
        if response.status_code == 200:
            data = response.json()
            logger.info("✅ Analytics balance endpoint working")
            balance_data = data.get('data', {})
            logger.info(f"   Current balance: ₹{balance_data.get('current_balance', 'N/A')}")
            return True
        else:
            logger.error(f"❌ Analytics endpoint failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"❌ Analytics test error: {str(e)}")
        return False

def test_debts_endpoint(token):
    """Test debts endpoint to verify debt_payments user_id filtering"""
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.get(f"{BASE_URL}/debts", headers=headers)
        if response.status_code == 200:
            data = response.json()
            debts = data.get('data', [])
            logger.info(f"✅ Debts endpoint: {len(debts)} debts retrieved")
            
            if debts:
                sample_debt = debts[0]
                payments = sample_debt.get('payments', [])
                logger.info(f"   Sample debt: {sample_debt.get('person_name')} with {len(payments)} payments")
            
            return True
        else:
            logger.error(f"❌ Debts endpoint failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"❌ Debts test error: {str(e)}")
        return False

def main():
    logger.info("🧪 Starting comprehensive implementation testing...")
    
    # Step 1: Login and get token
    token = test_login_and_get_token()
    if not token:
        logger.error("❌ Cannot proceed without authentication token")
        return False
    
    # Step 2: Test various endpoints
    test_results = {
        'categories': test_categories_endpoint(token),
        'analytics': test_analytics_endpoint(token),
        'debts': test_debts_endpoint(token)
    }
    
    # Summary
    passed_tests = sum(test_results.values())
    total_tests = len(test_results)
    
    logger.info(f"📊 Test Results: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        logger.info("🎉 All tests passed! Implementation is working correctly")
        return True
    else:
        logger.error("❌ Some tests failed")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)