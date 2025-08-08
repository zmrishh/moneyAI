from flask import Blueprint, request
from api.utils.auth_helpers import require_auth, get_current_user
from api.utils.response_helpers import success_response, error_response
from config import supabase_client
from datetime import datetime
import pytz

realtime_bp = Blueprint('realtime', __name__)

@realtime_bp.route('/sync', methods=['GET'])
@require_auth
def sync_all_data():
    """
    Real-time sync endpoint that returns all user data for immediate cross-tab updates
    This replaces the need for individual API calls when data changes
    """
    try:
        user = get_current_user()
        
        # Get user timezone
        user_timezone = user.get('timezone', 'Asia/Kolkata')
        tz = pytz.timezone(user_timezone)
        now_local = datetime.now(tz)
        
        # Fetch all data in parallel for instant updates
        transactions = supabase_client.table('transactions').select('*').eq('user_id', user['id']).order('created_at', desc=True).limit(20).execute()
        budgets = supabase_client.table('budgets').select('*').eq('user_id', user['id']).order('created_at', desc=True).execute()
        goals = supabase_client.table('goals').select('*').eq('user_id', user['id']).order('created_at', desc=True).execute()
        bills = supabase_client.table('bills').select('*').eq('user_id', user['id']).order('due_date', desc=False).execute()
        debts = supabase_client.table('debts').select('*').eq('user_id', user['id']).order('created_at', desc=True).execute()
        subscriptions = supabase_client.table('subscriptions').select('*').eq('user_id', user['id']).order('created_at', desc=True).execute()
        
        # Calculate quick summary stats
        all_transactions = supabase_client.table('transactions').select('amount, transaction_type, created_at').eq('user_id', user['id']).execute()
        
        total_income = sum(float(t['amount']) for t in all_transactions.data if t['transaction_type'] == 'income')
        total_expenses = sum(float(t['amount']) for t in all_transactions.data if t['transaction_type'] == 'expense')
        current_balance = total_income - total_expenses
        
        # Today's spending (using timezone-aware calculation)
        today_local = now_local.date()
        today_start = tz.localize(datetime.combine(today_local, datetime.min.time())).astimezone(pytz.UTC)
        today_end = tz.localize(datetime.combine(today_local, datetime.max.time())).astimezone(pytz.UTC)
        
        today_transactions = [t for t in all_transactions.data 
                            if today_start.isoformat() <= t['created_at'] <= today_end.isoformat()]
        today_spent = sum(float(t['amount']) for t in today_transactions if t['transaction_type'] == 'expense')
        
        # Active counts
        active_budgets = [b for b in budgets.data if b.get('is_active', True)]
        active_goals = [g for g in goals.data if not g.get('is_completed', False)]
        pending_bills = [b for b in bills.data if not b.get('is_paid', False)]
        active_debts = [d for d in debts.data if not d.get('is_settled', False)]
        active_subscriptions = [s for s in subscriptions.data if s.get('is_active', True)]
        
        sync_data = {
            'user': {
                'id': user['id'],
                'full_name': user.get('full_name', 'User'),
                'email': user.get('email', ''),
                'currency': user.get('currency', '₹')
            },
            'summary': {
                'current_balance': current_balance,
                'today_spent': today_spent,
                'total_income': total_income,
                'total_expenses': total_expenses,
                'active_budgets_count': len(active_budgets),
                'active_goals_count': len(active_goals),
                'pending_bills_count': len(pending_bills),
                'active_debts_count': len(active_debts),
                'active_subscriptions_count': len(active_subscriptions)
            },
            'data': {
                'transactions': transactions.data,
                'budgets': budgets.data,
                'goals': goals.data,
                'bills': bills.data,
                'debts': debts.data,
                'subscriptions': subscriptions.data
            },
            'meta': {
                'synced_at': now_local.isoformat(),
                'timestamp': now_local.timestamp(),
                'timezone': user_timezone,
                'cache_key': f"user_{user['id']}_{int(now_local.timestamp())}"
            }
        }
        
        return success_response(sync_data, "All data synchronized successfully")
        
    except Exception as e:
        return error_response(f"Failed to sync data: {str(e)}", 500)

@realtime_bp.route('/quick-stats', methods=['GET'])
@require_auth
def get_quick_stats():
    """
    Ultra-fast endpoint for just the summary stats that change frequently
    Perfect for real-time updates in the Today tab
    """
    try:
        user = get_current_user()
        
        # Get timezone
        user_timezone = user.get('timezone', 'Asia/Kolkata')
        tz = pytz.timezone(user_timezone)
        now_local = datetime.now(tz)
        today_local = now_local.date()
        
        # Quick calculation queries
        balance_query = supabase_client.table('transactions').select('amount, transaction_type').eq('user_id', user['id']).execute()
        
        total_income = sum(float(t['amount']) for t in balance_query.data if t['transaction_type'] == 'income')
        total_expenses = sum(float(t['amount']) for t in balance_query.data if t['transaction_type'] == 'expense')
        
        # Count queries
        budgets_count = supabase_client.table('budgets').select('id').eq('user_id', user['id']).eq('is_active', True).execute()
        goals_count = supabase_client.table('goals').select('id').eq('user_id', user['id']).eq('is_completed', False).execute()
        bills_count = supabase_client.table('bills').select('id').eq('user_id', user['id']).eq('is_paid', False).execute()
        debts_count = supabase_client.table('debts').select('id').eq('user_id', user['id']).eq('is_settled', False).execute()
        
        quick_stats = {
            'current_balance': total_income - total_expenses,
            'total_income': total_income,
            'total_expenses': total_expenses,
            'counts': {
                'active_budgets': len(budgets_count.data),
                'active_goals': len(goals_count.data),
                'pending_bills': len(bills_count.data),
                'active_debts': len(debts_count.data)
            },
            'user': {
                'full_name': user.get('full_name', 'User'),
                'currency': user.get('currency', '₹')
            },
            'meta': {
                'updated_at': now_local.isoformat(),
                'timestamp': now_local.timestamp()
            }
        }
        
        return success_response(quick_stats, "Quick stats retrieved")
        
    except Exception as e:
        return error_response(f"Failed to get quick stats: {str(e)}", 500)

@realtime_bp.route('/data-hash', methods=['GET'])
@require_auth  
def get_data_hash():
    """
    Returns a hash of user's data to detect changes
    Frontend can poll this to know when to refresh
    """
    try:
        user = get_current_user()
        
        # Get latest update timestamps from each table
        tables = ['transactions', 'budgets', 'goals', 'bills', 'debts', 'subscriptions']
        latest_updates = {}
        
        for table in tables:
            result = supabase_client.table(table).select('updated_at').eq('user_id', user['id']).order('updated_at', desc=True).limit(1).execute()
            latest_updates[table] = result.data[0]['updated_at'] if result.data else '1970-01-01T00:00:00'
        
        # Create a simple hash from timestamps
        data_signature = '|'.join([f"{table}:{timestamp}" for table, timestamp in latest_updates.items()])
        hash_value = hash(data_signature)
        
        hash_data = {
            'data_hash': hash_value,
            'last_modified': max(latest_updates.values()),
            'table_timestamps': latest_updates,
            'timestamp': datetime.utcnow().timestamp()
        }
        
        return success_response(hash_data, "Data hash generated")
        
    except Exception as e:
        return error_response(f"Failed to generate data hash: {str(e)}", 500)