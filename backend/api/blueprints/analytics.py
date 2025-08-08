from flask import Blueprint, request
from api.utils.auth_helpers import require_auth, get_current_user
from api.utils.response_helpers import success_response, error_response
from config import supabase_client
from datetime import datetime, date, timedelta
from collections import defaultdict
import calendar
import pytz

analytics_bp = Blueprint('analytics', __name__)

def get_day_boundaries(target_date: date, timezone_str: str = 'Asia/Kolkata'):
    """
    Get precise day boundaries (12:00 AM to 11:59 PM) for a specific date in timezone
    Returns UTC timestamps for database querying
    """
    tz = pytz.timezone(timezone_str)
    
    # Start of day: 12:00 AM (00:00:00) in local timezone
    start_of_day = tz.localize(datetime.combine(target_date, datetime.min.time()))
    
    # End of day: 11:59:59.999999 PM in local timezone  
    end_of_day = tz.localize(datetime.combine(target_date, datetime.max.time()))
    
    # Convert to UTC for database queries
    return start_of_day.astimezone(pytz.UTC), end_of_day.astimezone(pytz.UTC)

def get_week_boundaries(target_date: date, timezone_str: str = 'Asia/Kolkata'):
    """Get week boundaries from Monday 12:00 AM to Sunday 11:59 PM"""
    # Calculate Monday of the week
    monday = target_date - timedelta(days=target_date.weekday())
    # Calculate Sunday of the week
    sunday = monday + timedelta(days=6)
    
    start_utc, _ = get_day_boundaries(monday, timezone_str)
    _, end_utc = get_day_boundaries(sunday, timezone_str)
    
    return start_utc, end_utc

def get_month_boundaries(target_date: date, timezone_str: str = 'Asia/Kolkata'):
    """Get month boundaries from 1st 12:00 AM to last day 11:59 PM"""
    first_day = target_date.replace(day=1)
    last_day = date(target_date.year, target_date.month, calendar.monthrange(target_date.year, target_date.month)[1])
    
    start_utc, _ = get_day_boundaries(first_day, timezone_str)
    _, end_utc = get_day_boundaries(last_day, timezone_str)
    
    return start_utc, end_utc

@analytics_bp.route('/balance', methods=['GET'])
@require_auth
def get_current_balance():
    """Get current balance, today's and weekly spending with comprehensive user info and timezone-aware calculations"""
    try:
        user = get_current_user()
        
        # Get user timezone from profile or default to Asia/Kolkata
        user_timezone = user.get('timezone', 'Asia/Kolkata')
        
        # Get current date in user's timezone
        tz = pytz.timezone(user_timezone)
        now_local = datetime.now(tz)
        today_local = now_local.date()
        
        # Get precise day boundaries for today
        today_start_utc, today_end_utc = get_day_boundaries(today_local, user_timezone)
        
        # Get week boundaries (Monday to Sunday)
        week_start_utc, week_end_utc = get_week_boundaries(today_local, user_timezone)
        
        # Get month boundaries 
        month_start_utc, month_end_utc = get_month_boundaries(today_local, user_timezone)
        
        # Get all transactions to calculate overall balance
        all_transactions = supabase_client.table('transactions').select('amount, transaction_type').eq('user_id', user['id']).execute()
        
        # Calculate current balance (total income - total expenses)
        total_income = sum(float(t['amount']) for t in all_transactions.data if t['transaction_type'] == 'income')
        total_expense = sum(float(t['amount']) for t in all_transactions.data if t['transaction_type'] == 'expense')
        current_balance = total_income - total_expense
        
        # Get today's transactions with timezone-aware boundaries
        today_transactions = supabase_client.table('transactions').select('amount, transaction_type, created_at').eq('user_id', user['id'])
        today_transactions = today_transactions.gte('created_at', today_start_utc.isoformat()).lte('created_at', today_end_utc.isoformat()).execute()
        
        # Calculate today's spending and income
        today_income = sum(float(t['amount']) for t in today_transactions.data if t['transaction_type'] == 'income')
        today_expense = sum(float(t['amount']) for t in today_transactions.data if t['transaction_type'] == 'expense')
        
        # Get this week's transactions with timezone-aware boundaries
        week_transactions = supabase_client.table('transactions').select('*').eq('user_id', user['id'])
        week_transactions = week_transactions.gte('created_at', week_start_utc.isoformat()).lte('created_at', week_end_utc.isoformat()).execute()
        
        # Calculate weekly spending and income
        week_income = sum(float(t['amount']) for t in week_transactions.data if t['transaction_type'] == 'income')
        week_expense = sum(float(t['amount']) for t in week_transactions.data if t['transaction_type'] == 'expense')
        
        # Get top category for this week
        week_expense_transactions = [t for t in week_transactions.data if t['transaction_type'] == 'expense']
        category_spending = defaultdict(float)
        for transaction in week_expense_transactions:
            category_spending[transaction['category_name']] += float(transaction['amount'])
        
        top_category = max(category_spending.items(), key=lambda x: x[1]) if category_spending else ('None', 0)
        
        # Get current month budget total with timezone-aware boundaries
        month_budgets = supabase_client.table('budgets').select('amount').eq('user_id', user['id']).eq('is_active', True).execute()
        
        total_monthly_budget = sum(float(b['amount']) for b in month_budgets.data)
        
        # Get current month spending with timezone-aware boundaries
        month_transactions = supabase_client.table('transactions').select('amount, transaction_type').eq('user_id', user['id'])
        month_transactions = month_transactions.gte('created_at', month_start_utc.isoformat()).lte('created_at', month_end_utc.isoformat()).execute()
        
        month_expense = sum(float(t['amount']) for t in month_transactions.data if t['transaction_type'] == 'expense')
        month_income = sum(float(t['amount']) for t in month_transactions.data if t['transaction_type'] == 'income')
        
        # Calculate daily average spending for this month
        days_in_month = (today_local - today_local.replace(day=1)).days + 1
        daily_average_spending = month_expense / days_in_month if days_in_month > 0 else 0
        
        balance_data = {
            'current_balance': current_balance,
            'user': {
                'id': user['id'], 
                'full_name': user.get('full_name', 'User'),
                'email': user.get('email', ''),
                'avatar_url': user.get('avatar_url'),
                'timezone': user_timezone,
                'currency': user.get('currency', '₹')
            },
            'today': {
                'spent': today_expense,
                'earned': today_income,
                'net': today_income - today_expense,
                'transaction_count': len(today_transactions.data),
                'date': today_local.isoformat()
            },
            'this_week': {
                'spent': week_expense,
                'earned': week_income,
                'net': week_income - week_expense,
                'transaction_count': len(week_transactions.data),
                'daily_average_spending': week_expense / 7 if week_expense > 0 else 0,
                'week_start': (today_local - timedelta(days=today_local.weekday())).isoformat(),
                'week_end': today_local.isoformat()
            },
            'this_month': {
                'spent': month_expense,
                'earned': month_income,
                'net': month_income - month_expense,
                'transaction_count': len(month_transactions.data),
                'daily_average_spending': daily_average_spending,
                'month_start': today_local.replace(day=1).isoformat(),
                'month_end': today_local.isoformat(),
                'days_elapsed': days_in_month
            },
            'budgets': {
                'total_budget': total_monthly_budget,
                'spent_amount': month_expense,
                'remaining_amount': total_monthly_budget - month_expense,
                'budget_used_percentage': (month_expense / total_monthly_budget * 100) if total_monthly_budget > 0 else 0,
                'is_over_budget': month_expense > total_monthly_budget
            },
            'insights': {
                'transactions_this_week': len(week_expense_transactions),
                'top_category': {
                    'name': top_category[0],
                    'amount': top_category[1]
                },
                'spending_trend': 'increasing' if week_expense > (month_expense / 4) else 'stable'
            },
            'overall': {
                'total_income': total_income,
                'total_expense': total_expense,
                'transaction_count': len(all_transactions.data),
                'net_worth': total_income - total_expense
            },
            'timezone_info': {
                'user_timezone': user_timezone,
                'local_time': now_local.isoformat(),
                'utc_time': datetime.utcnow().isoformat()
            },
            'date': today_local.isoformat()
        }
        
        return success_response(balance_data, "Balance data retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve balance data: {str(e)}", 500)

@analytics_bp.route('/realtime-summary', methods=['GET'])
@require_auth
def get_realtime_summary():
    """Get comprehensive real-time summary for all tabs with change tracking"""
    try:
        user = get_current_user()
        
        # Get user timezone
        user_timezone = user.get('timezone', 'Asia/Kolkata')
        tz = pytz.timezone(user_timezone)
        now_local = datetime.now(tz)
        today_local = now_local.date()
        
        # Get precise day boundaries
        today_start_utc, today_end_utc = get_day_boundaries(today_local, user_timezone)
        week_start_utc, week_end_utc = get_week_boundaries(today_local, user_timezone)
        month_start_utc, month_end_utc = get_month_boundaries(today_local, user_timezone)
        
        # Get ALL data for all tabs in parallel
        all_transactions = supabase_client.table('transactions').select('*').eq('user_id', user['id']).execute()
        all_budgets = supabase_client.table('budgets').select('*').eq('user_id', user['id']).execute()
        all_goals = supabase_client.table('goals').select('*').eq('user_id', user['id']).execute()
        all_bills = supabase_client.table('bills').select('*').eq('user_id', user['id']).execute()
        all_debts = supabase_client.table('debts').select('*').eq('user_id', user['id']).execute()
        all_subscriptions = supabase_client.table('subscriptions').select('*').eq('user_id', user['id']).execute()
        
        # Calculate today's transactions
        today_transactions = [t for t in all_transactions.data 
                            if today_start_utc.isoformat() <= t['created_at'] <= today_end_utc.isoformat()]
        
        # Calculate totals
        total_income = sum(float(t['amount']) for t in all_transactions.data if t['transaction_type'] == 'income')
        total_expense = sum(float(t['amount']) for t in all_transactions.data if t['transaction_type'] == 'expense')
        current_balance = total_income - total_expense
        
        # Today's totals
        today_income = sum(float(t['amount']) for t in today_transactions if t['transaction_type'] == 'income')
        today_expense = sum(float(t['amount']) for t in today_transactions if t['transaction_type'] == 'expense')
        
        # Active budgets
        active_budgets = [b for b in all_budgets.data if b.get('is_active', True)]
        total_budget = sum(float(b['amount']) for b in active_budgets)
        
        # Active goals
        active_goals = [g for g in all_goals.data if not g.get('is_completed', False)]
        
        # Pending bills
        pending_bills = [b for b in all_bills.data if not b.get('is_paid', False)]
        
        # Active debts
        active_debts = [d for d in all_debts.data if not d.get('is_settled', False)]
        
        # Active subscriptions
        active_subscriptions = [s for s in all_subscriptions.data if s.get('is_active', True)]
        
        # Month spending for budget comparison
        month_transactions = [t for t in all_transactions.data 
                            if month_start_utc.isoformat() <= t['created_at'] <= month_end_utc.isoformat()]
        month_expense = sum(float(t['amount']) for t in month_transactions if t['transaction_type'] == 'expense')
        
        realtime_summary = {
            'user': {
                'id': user['id'],
                'full_name': user.get('full_name', 'User'),
                'email': user.get('email', ''),
                'currency': user.get('currency', '₹')
            },
            'financial_overview': {
                'current_balance': current_balance,
                'total_income': total_income,
                'total_expenses': total_expense,
                'today_spent': today_expense,
                'today_earned': today_income
            },
            'budgets_summary': {
                'total_budget': total_budget,
                'month_spent': month_expense,
                'remaining_budget': total_budget - month_expense,
                'budget_used_percentage': (month_expense / total_budget * 100) if total_budget > 0 else 0,
                'is_over_budget': month_expense > total_budget,
                'active_budgets_count': len(active_budgets)
            },
            'goals_summary': {
                'active_goals_count': len(active_goals),
                'total_target_amount': sum(float(g['target_amount']) for g in active_goals),
                'total_saved_amount': sum(float(g['current_amount']) for g in active_goals),
                'goals_completion_percentage': (sum(float(g['current_amount']) for g in active_goals) / 
                                              sum(float(g['target_amount']) for g in active_goals) * 100) if active_goals else 0
            },
            'bills_summary': {
                'pending_bills_count': len(pending_bills),
                'total_pending_amount': sum(float(b['amount']) for b in pending_bills),
                'upcoming_bills': len([b for b in pending_bills 
                                     if datetime.fromisoformat(b['due_date']).date() <= (today_local + timedelta(days=7))])
            },
            'debts_summary': {
                'active_debts_count': len(active_debts),
                'total_debt_amount': sum(float(d['amount']) for d in active_debts),
                'owe_amount': sum(float(d['amount']) for d in active_debts if d['debt_type'] == 'owe'),
                'owed_amount': sum(float(d['amount']) for d in active_debts if d['debt_type'] == 'owed')
            },
            'subscriptions_summary': {
                'active_subscriptions_count': len(active_subscriptions),
                'monthly_subscription_cost': sum(
                    float(s['amount']) if s['billing_cycle'] == 'monthly' else
                    float(s['amount']) * 4 if s['billing_cycle'] == 'weekly' else
                    float(s['amount']) / 12 if s['billing_cycle'] == 'yearly' else
                    float(s['amount']) / 3 if s['billing_cycle'] == 'quarterly' else 0
                    for s in active_subscriptions
                )
            },
            'recent_activity': {
                'today_transactions_count': len(today_transactions),
                'recent_transactions': sorted(all_transactions.data, 
                                            key=lambda x: x['created_at'], reverse=True)[:5]
            },
            'meta': {
                'last_updated': now_local.isoformat(),
                'timezone': user_timezone,
                'date': today_local.isoformat(),
                'timestamp': now_local.timestamp()
            }
        }
        
        return success_response(realtime_summary, "Real-time summary retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve real-time summary: {str(e)}", 500)

@analytics_bp.route('/recent-activity', methods=['GET'])
@require_auth
def get_recent_activity():
    """Get recent activity/transactions for the user"""
    try:
        user = get_current_user()
        
        # Parameters
        limit = int(request.args.get('limit', 20))  # Default 20 recent activities
        days_back = int(request.args.get('days_back', 30))  # Default last 30 days
        
        # Calculate date range
        end_date = date.today()
        start_date = end_date - timedelta(days=days_back)
        
        # Get recent transactions
        recent_transactions = supabase_client.table('transactions').select('*').eq('user_id', user['id'])
        recent_transactions = recent_transactions.gte('date', start_date.isoformat())
        recent_transactions = recent_transactions.order('created_at', desc=True).limit(limit).execute()
        
        # Format activity data
        activities = []
        for transaction in recent_transactions.data:
            activity = {
                'id': transaction['id'],
                'type': 'transaction',
                'action': 'added' if transaction['transaction_type'] == 'expense' else 'received',
                'title': transaction['description'],
                'amount': float(transaction['amount']),
                'transaction_type': transaction['transaction_type'],
                'category': transaction['category_name'],
                'date': transaction['date'],
                'created_at': transaction['created_at'],
                'source': transaction['source'],
                'merchant': transaction.get('merchant'),
                'location': transaction.get('location'),
                'notes': transaction.get('notes'),
                'tags': transaction.get('tags', [])
            }
            activities.append(activity)
        
        # Get recent goal updates (if any goals were updated recently)
        recent_goals = supabase_client.table('goals').select('*').eq('user_id', user['id'])
        recent_goals = recent_goals.gte('updated_at', start_date.isoformat())
        recent_goals = recent_goals.order('updated_at', desc=True).limit(5).execute()
        
        for goal in recent_goals.data:
            activity = {
                'id': goal['id'],
                'type': 'goal',
                'action': 'completed' if goal['is_completed'] else 'updated',
                'title': f"Goal: {goal['title']}",
                'amount': float(goal['current_amount']),
                'target_amount': float(goal['target_amount']),
                'progress_percentage': (float(goal['current_amount']) / float(goal['target_amount']) * 100) if float(goal['target_amount']) > 0 else 0,
                'date': goal['updated_at'],
                'created_at': goal['updated_at'],
                'goal_type': goal['goal_type'],
                'priority': goal['priority']
            }
            activities.append(activity)
        
        # Get recent budget activities (budgets created/updated recently)
        recent_budgets = supabase_client.table('budgets').select('*').eq('user_id', user['id'])
        recent_budgets = recent_budgets.gte('updated_at', start_date.isoformat())
        recent_budgets = recent_budgets.order('updated_at', desc=True).limit(3).execute()
        
        for budget in recent_budgets.data:
            activity = {
                'id': budget['id'],
                'type': 'budget',
                'action': 'created' if budget['created_at'] == budget['updated_at'] else 'updated',
                'title': f"Budget: {budget['name']}",
                'amount': float(budget['amount']),
                'spent_amount': float(budget['spent_amount']),
                'percentage_used': (float(budget['spent_amount']) / float(budget['amount']) * 100) if float(budget['amount']) > 0 else 0,
                'date': budget['updated_at'],
                'created_at': budget['updated_at'],
                'period': budget['period'],
                'is_active': budget['is_active']
            }
            activities.append(activity)
        
        # Sort all activities by date (most recent first)
        activities.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Limit to requested number
        activities = activities[:limit]
        
        # Calculate summary stats
        transaction_activities = [a for a in activities if a['type'] == 'transaction']
        total_spent_recent = sum(a['amount'] for a in transaction_activities if a['transaction_type'] == 'expense')
        total_earned_recent = sum(a['amount'] for a in transaction_activities if a['transaction_type'] == 'income')
        
        activity_data = {
            'activities': activities,
            'summary': {
                'total_activities': len(activities),
                'transaction_count': len(transaction_activities),
                'total_spent': total_spent_recent,
                'total_earned': total_earned_recent,
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                }
            },
            'filters': {
                'limit': limit,
                'days_back': days_back
            }
        }
        
        return success_response(activity_data, "Recent activity retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve recent activity: {str(e)}", 500)

@analytics_bp.route('/bills-payments', methods=['GET'])
@require_auth
def get_bills_payments():
    """Get bills and payments dashboard with due dates and payment status"""
    try:
        user = get_current_user()
        today = date.today()
        
        # Parameters
        filter_type = request.args.get('filter', 'all')  # all, due_soon, overdue, paid, unpaid
        
        # Get all bills
        bills_query = supabase_client.table('bills').select('*').eq('user_id', user['id'])
        
        # Apply filters
        if filter_type == 'due_soon':
            next_week = today + timedelta(days=7)
            bills_query = bills_query.gte('due_date', today.isoformat()).lte('due_date', next_week.isoformat()).eq('is_paid', False)
        elif filter_type == 'overdue':
            bills_query = bills_query.lt('due_date', today.isoformat()).eq('is_paid', False)
        elif filter_type == 'paid':
            bills_query = bills_query.eq('is_paid', True)
        elif filter_type == 'unpaid':
            bills_query = bills_query.eq('is_paid', False)
        
        bills_result = bills_query.order('due_date', desc=False).execute()
        
        # Process bills data
        bills_data = []
        total_due_amount = 0
        overdue_count = 0
        due_soon_count = 0
        
        for bill in bills_result.data:
            bill_due_date = datetime.fromisoformat(bill['due_date']).date()
            days_until_due = (bill_due_date - today).days
            
            # Determine status
            if bill['is_paid']:
                status = 'paid'
            elif days_until_due < 0:
                status = 'overdue'
                overdue_count += 1
            elif days_until_due <= 7:
                status = 'due_soon'
                due_soon_count += 1
            else:
                status = 'upcoming'
            
            # Add to total due if unpaid
            if not bill['is_paid']:
                total_due_amount += float(bill['amount'])
            
            bill_info = {
                'id': bill['id'],
                'name': bill['name'],
                'amount': float(bill['amount']),
                'category': bill['category'],
                'due_date': bill['due_date'],
                'days_until_due': days_until_due,
                'is_paid': bill['is_paid'],
                'payment_date': bill.get('payment_date'),
                'auto_pay': bill['auto_pay'],
                'is_recurring': bill['is_recurring'],
                'recurrence_pattern': bill.get('recurrence_pattern'),
                'late_fee': float(bill['late_fee']) if bill.get('late_fee') else 0,
                'reminder_days': bill['reminder_days'],
                'status': status,
                'created_at': bill['created_at'],
                'updated_at': bill['updated_at']
            }
            bills_data.append(bill_info)
        
        # Get category-wise spending on bills this month
        month_start = today.replace(day=1)
        monthly_bills = supabase_client.table('bills').select('amount, category').eq('user_id', user['id']).eq('is_paid', True)
        monthly_bills = monthly_bills.gte('payment_date', month_start.isoformat()).execute()
        
        category_spending = defaultdict(float)
        for bill in monthly_bills.data:
            category_spending[bill['category']] += float(bill['amount'])
        
        # Summary statistics
        summary = {
            'total_bills': len(bills_result.data),
            'total_due_amount': total_due_amount,
            'overdue_count': overdue_count,
            'due_soon_count': due_soon_count,
            'paid_this_month': len(monthly_bills.data),
            'monthly_spending': sum(category_spending.values()),
            'auto_pay_enabled': sum(1 for bill in bills_result.data if bill['auto_pay']),
            'category_breakdown': dict(category_spending),
            'next_due_date': min([bill['due_date'] for bill in bills_result.data if not bill['is_paid']], default=None)
        }
        
        bills_payments_data = {
            'bills': bills_data,
            'summary': summary,
            'filter_applied': filter_type,
            'date': today.isoformat()
        }
        
        return success_response(bills_payments_data, "Bills and payments data retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve bills and payments data: {str(e)}", 500)

@analytics_bp.route('/bills-categories', methods=['GET'])
@require_auth
def get_bills_categories():
    """Get bill categories with counts for frontend navigation"""
    try:
        user = get_current_user()
        today = date.today()
        next_week = today + timedelta(days=7)
        
        # Get all bills for counting
        all_bills = supabase_client.table('bills').select('*').eq('user_id', user['id']).execute()
        
        # Count bills by category
        all_count = len(all_bills.data)
        due_soon_count = 0
        overdue_count = 0
        paid_count = 0
        unpaid_count = 0
        auto_pay_count = 0
        
        for bill in all_bills.data:
            bill_due_date = datetime.fromisoformat(bill['due_date']).date()
            days_until_due = (bill_due_date - today).days
            
            if bill['is_paid']:
                paid_count += 1
            else:
                unpaid_count += 1
                
            if not bill['is_paid'] and days_until_due <= 7 and days_until_due >= 0:
                due_soon_count += 1
                
            if not bill['is_paid'] and days_until_due < 0:
                overdue_count += 1
                
            if bill['auto_pay']:
                auto_pay_count += 1
        
        # Calculate total amounts
        total_due_amount = sum(float(bill['amount']) for bill in all_bills.data if not bill['is_paid'])
        due_soon_amount = sum(
            float(bill['amount']) for bill in all_bills.data 
            if not bill['is_paid'] and 0 <= (datetime.fromisoformat(bill['due_date']).date() - today).days <= 7
        )
        overdue_amount = sum(
            float(bill['amount']) for bill in all_bills.data 
            if not bill['is_paid'] and (datetime.fromisoformat(bill['due_date']).date() - today).days < 0
        )
        
        # Create categories with counts
        categories = [
            {
                'id': 'all',
                'name': 'All Bills',
                'display_name': f'All Bills ({all_count})',
                'count': all_count,
                'amount': sum(float(bill['amount']) for bill in all_bills.data),
                'description': 'All bills in your account',
                'filter': 'all',
                'icon': '📋',
                'color': '#3B82F6'
            },
            {
                'id': 'due_soon',
                'name': 'Due Soon',
                'display_name': f'Due Soon ({due_soon_count})',
                'count': due_soon_count,
                'amount': due_soon_amount,
                'description': 'Bills due within the next 7 days',
                'filter': 'due_soon',
                'icon': '⏰',
                'color': '#F59E0B'
            },
            {
                'id': 'overdue',
                'name': 'Overdue',
                'display_name': f'Overdue ({overdue_count})',
                'count': overdue_count,
                'amount': overdue_amount,
                'description': 'Bills that are past their due date',
                'filter': 'overdue',
                'icon': '🚨',
                'color': '#EF4444'
            },
            {
                'id': 'paid',
                'name': 'Paid',
                'display_name': f'Paid ({paid_count})',
                'count': paid_count,
                'amount': sum(float(bill['amount']) for bill in all_bills.data if bill['is_paid']),
                'description': 'Bills that have been paid',
                'filter': 'paid',
                'icon': '✅',
                'color': '#10B981'
            },
            {
                'id': 'unpaid',
                'name': 'Unpaid',
                'display_name': f'Unpaid ({unpaid_count})',
                'count': unpaid_count,
                'amount': total_due_amount,
                'description': 'Bills that are still pending payment',
                'filter': 'unpaid',
                'icon': '💳',
                'color': '#6B7280'
            },
            {
                'id': 'auto_pay',
                'name': 'Auto Pay',
                'display_name': f'Auto Pay ({auto_pay_count})',
                'count': auto_pay_count,
                'amount': sum(float(bill['amount']) for bill in all_bills.data if bill['auto_pay']),
                'description': 'Bills with automatic payment enabled',
                'filter': 'auto_pay',
                'icon': '🔄',
                'color': '#8B5CF6'
            }
        ]
        
        # Summary for quick stats
        summary = {
            'total_bills': all_count,
            'immediate_attention': due_soon_count + overdue_count,
            'total_due_amount': total_due_amount,
            'next_payment_date': min([
                bill['due_date'] for bill in all_bills.data 
                if not bill['is_paid']
            ], default=None),
            'auto_pay_percentage': (auto_pay_count / all_count * 100) if all_count > 0 else 0
        }
        
        categories_data = {
            'categories': categories,
            'summary': summary,
            'date': today.isoformat()
        }
        
        return success_response(categories_data, "Bill categories retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve bill categories: {str(e)}", 500)

@analytics_bp.route('/debts-iou', methods=['GET'])
@require_auth
def get_debts_iou():
    """Get debts and IOUs dashboard with I Owe vs Owed to Me separation"""
    try:
        user = get_current_user()
        today = date.today()
        
        # Parameters
        debt_type_filter = request.args.get('type', 'all')  # all, owe, owed
        
        # Get all debts
        debts_query = supabase_client.table('debts').select('*').eq('user_id', user['id'])
        
        # Apply debt type filter
        if debt_type_filter == 'owe':
            debts_query = debts_query.eq('debt_type', 'owe')
        elif debt_type_filter == 'owed':
            debts_query = debts_query.eq('debt_type', 'owed')
            
        debts_result = debts_query.order('created_at', desc=True).execute()
        
        # Get debt payments for calculating remaining amounts
        debt_payments = supabase_client.table('debt_payments').select('*', 'debt_id').execute()
        payments_by_debt = defaultdict(list)
        for payment in debt_payments.data:
            payments_by_debt[payment['debt_id']].append(payment)
        
        # Process debts data
        i_owe_debts = []
        owed_to_me_debts = []
        total_i_owe = 0
        total_owed_to_me = 0
        overdue_i_owe = 0
        overdue_owed_to_me = 0
        
        for debt in debts_result.data:
            # Calculate remaining amount after payments
            debt_payments_list = payments_by_debt.get(debt['id'], [])
            total_payments = sum(float(payment['amount']) for payment in debt_payments_list)
            remaining_amount = float(debt['amount']) - total_payments
            
            # Check if overdue
            is_overdue = False
            if debt.get('due_date'):
                due_date = datetime.fromisoformat(debt['due_date']).date()
                is_overdue = due_date < today and not debt['is_settled']
            
            debt_info = {
                'id': debt['id'],
                'person_name': debt['person_name'],
                'person_contact': debt.get('person_contact'),
                'original_amount': float(debt['original_amount']),
                'current_amount': remaining_amount,
                'amount_paid': total_payments,
                'description': debt['description'],
                'due_date': debt.get('due_date'),
                'created_date': debt['created_date'],
                'is_settled': debt['is_settled'],
                'settled_date': debt.get('settled_date'),
                'is_overdue': is_overdue,
                'payment_count': len(debt_payments_list),
                'latest_payment': max([p['date'] for p in debt_payments_list], default=None),
                'created_at': debt['created_at'],
                'updated_at': debt['updated_at']
            }
            
            if debt['debt_type'] == 'owe':
                i_owe_debts.append(debt_info)
                if not debt['is_settled']:
                    total_i_owe += remaining_amount
                    if is_overdue:
                        overdue_i_owe += 1
            else:  # 'owed'
                owed_to_me_debts.append(debt_info)
                if not debt['is_settled']:
                    total_owed_to_me += remaining_amount
                    if is_overdue:
                        overdue_owed_to_me += 1
        
        # Summary statistics
        summary = {
            'total_i_owe': total_i_owe,
            'total_owed_to_me': total_owed_to_me,
            'net_position': total_owed_to_me - total_i_owe,  # Positive = more owed to me
            'i_owe_count': len([d for d in i_owe_debts if not d['is_settled']]),
            'owed_to_me_count': len([d for d in owed_to_me_debts if not d['is_settled']]),
            'total_active_debts': len([d for d in debts_result.data if not d['is_settled']]),
            'overdue_i_owe': overdue_i_owe,
            'overdue_owed_to_me': overdue_owed_to_me,
            'settled_this_month': len([
                d for d in debts_result.data 
                if d['is_settled'] and d.get('settled_date') and 
                datetime.fromisoformat(d['settled_date']).date() >= today.replace(day=1)
            ])
        }
        
        # Categories for frontend navigation
        categories = [
            {
                'id': 'all',
                'name': 'All Debts',
                'display_name': f'All Debts ({len(debts_result.data)})',
                'count': len(debts_result.data),
                'filter': 'all',
                'icon': '📊',
                'color': '#6B7280'
            },
            {
                'id': 'i_owe',
                'name': 'I Owe',
                'display_name': f'I Owe ({summary["i_owe_count"]})',
                'count': summary['i_owe_count'],
                'amount': total_i_owe,
                'filter': 'owe',
                'icon': '💸',
                'color': '#EF4444'
            },
            {
                'id': 'owed_to_me',
                'name': 'Owed to Me',
                'display_name': f'Owed to Me ({summary["owed_to_me_count"]})',
                'count': summary['owed_to_me_count'],
                'amount': total_owed_to_me,
                'filter': 'owed',
                'icon': '💰',
                'color': '#10B981'
            }
        ]
        
        debts_iou_data = {
            'i_owe': i_owe_debts,
            'owed_to_me': owed_to_me_debts,
            'summary': summary,
            'categories': categories,
            'filter_applied': debt_type_filter,
            'date': today.isoformat()
        }
        
        return success_response(debts_iou_data, "Debts and IOUs retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve debts and IOUs: {str(e)}", 500)

@analytics_bp.route('/subscriptions', methods=['GET'])
@require_auth
def get_subscriptions():
    """Get subscriptions dashboard with billing cycles and active status"""
    try:
        user = get_current_user()
        today = date.today()
        
        # Parameters
        status_filter = request.args.get('status', 'all')  # all, active, cancelled
        
        # Get all subscriptions
        subscriptions_query = supabase_client.table('subscriptions').select('*').eq('user_id', user['id'])
        
        # Apply status filter
        if status_filter == 'active':
            subscriptions_query = subscriptions_query.eq('is_active', True)
        elif status_filter == 'cancelled':
            subscriptions_query = subscriptions_query.eq('is_active', False)
            
        subscriptions_result = subscriptions_query.order('created_at', desc=True).execute()
        
        # Get price changes for tracking subscription cost changes
        price_changes = supabase_client.table('price_changes').select('*').execute()
        changes_by_subscription = defaultdict(list)
        for change in price_changes.data:
            changes_by_subscription[change['subscription_id']].append(change)
        
        # Process subscriptions data
        active_subscriptions = []
        cancelled_subscriptions = []
        total_monthly_cost = 0
        total_yearly_cost = 0
        due_soon_count = 0
        
        for subscription in subscriptions_result.data:
            next_billing = datetime.fromisoformat(subscription['next_billing_date']).date()
            days_until_billing = (next_billing - today).days
            
            # Convert all amounts to monthly for comparison
            amount = float(subscription['amount'])
            monthly_equivalent = amount
            yearly_equivalent = amount
            
            if subscription['billing_cycle'] == 'daily':
                monthly_equivalent = amount * 30
                yearly_equivalent = amount * 365
            elif subscription['billing_cycle'] == 'weekly':
                monthly_equivalent = amount * 4.33  # Average weeks per month
                yearly_equivalent = amount * 52
            elif subscription['billing_cycle'] == 'monthly':
                yearly_equivalent = amount * 12
            elif subscription['billing_cycle'] == 'quarterly':
                monthly_equivalent = amount / 3
                yearly_equivalent = amount * 4
            elif subscription['billing_cycle'] == 'yearly':
                monthly_equivalent = amount / 12
                yearly_equivalent = amount
            
            # Check if billing soon (within 7 days)
            if subscription['is_active'] and days_until_billing <= 7 and days_until_billing >= 0:
                due_soon_count += 1
            
            # Get price change history
            price_history = changes_by_subscription.get(subscription['id'], [])
            latest_price_change = max(price_history, key=lambda x: x['change_date'], default=None) if price_history else None
            
            subscription_info = {
                'id': subscription['id'],
                'name': subscription['name'],
                'amount': amount,
                'billing_cycle': subscription['billing_cycle'],
                'billing_display': f"{amount}/{subscription['billing_cycle']}",
                'monthly_equivalent': round(monthly_equivalent, 2),
                'yearly_equivalent': round(yearly_equivalent, 2),
                'category': subscription['category'],
                'next_billing_date': subscription['next_billing_date'],
                'days_until_billing': days_until_billing,
                'billing_status': 'due_soon' if days_until_billing <= 7 and days_until_billing >= 0 else 'upcoming',
                'is_active': subscription['is_active'],
                'auto_renew': subscription['auto_renew'],
                'reminder_days': subscription['reminder_days'],
                'price_changes_count': len(price_history),
                'latest_price_change': latest_price_change,
                'created_at': subscription['created_at'],
                'updated_at': subscription['updated_at']
            }
            
            if subscription['is_active']:
                active_subscriptions.append(subscription_info)
                total_monthly_cost += monthly_equivalent
                total_yearly_cost += yearly_equivalent
            else:
                cancelled_subscriptions.append(subscription_info)
        
        # Category breakdown for active subscriptions
        category_spending = defaultdict(float)
        category_counts = defaultdict(int)
        for sub in active_subscriptions:
            category_spending[sub['category']] += sub['monthly_equivalent']
            category_counts[sub['category']] += 1
        
        # Summary statistics
        summary = {
            'total_subscriptions': len(subscriptions_result.data),
            'active_subscriptions': len(active_subscriptions),
            'cancelled_subscriptions': len(cancelled_subscriptions),
            'total_monthly_cost': round(total_monthly_cost, 2),
            'total_yearly_cost': round(total_yearly_cost, 2),
            'average_monthly_per_subscription': round(total_monthly_cost / len(active_subscriptions), 2) if active_subscriptions else 0,
            'due_soon_count': due_soon_count,
            'auto_renew_count': sum(1 for sub in active_subscriptions if sub['auto_renew']),
            'category_breakdown': dict(category_spending),
            'category_counts': dict(category_counts),
            'next_billing_date': min([sub['next_billing_date'] for sub in active_subscriptions], default=None),
            'most_expensive': max(active_subscriptions, key=lambda x: x['monthly_equivalent'], default=None),
            'cheapest': min(active_subscriptions, key=lambda x: x['monthly_equivalent'], default=None)
        }
        
        # Categories for frontend navigation
        categories = [
            {
                'id': 'all',
                'name': 'All Subscriptions',
                'display_name': f'All Subscriptions ({summary["total_subscriptions"]})',
                'count': summary['total_subscriptions'],
                'filter': 'all',
                'icon': '📱',
                'color': '#6B7280'
            },
            {
                'id': 'active',
                'name': 'Active',
                'display_name': f'Active ({summary["active_subscriptions"]})',
                'count': summary['active_subscriptions'],
                'amount': summary['total_monthly_cost'],
                'filter': 'active',
                'icon': '✅',
                'color': '#10B981'
            },
            {
                'id': 'cancelled',
                'name': 'Cancelled',
                'display_name': f'Cancelled ({summary["cancelled_subscriptions"]})',
                'count': summary['cancelled_subscriptions'],
                'filter': 'cancelled',
                'icon': '❌',
                'color': '#EF4444'
            },
            {
                'id': 'due_soon',
                'name': 'Due Soon',
                'display_name': f'Due Soon ({due_soon_count})',
                'count': due_soon_count,
                'filter': 'due_soon',
                'icon': '⏰',
                'color': '#F59E0B'
            }
        ]
        
        subscriptions_data = {
            'active_subscriptions': active_subscriptions,
            'cancelled_subscriptions': cancelled_subscriptions,
            'summary': summary,
            'categories': categories,
            'filter_applied': status_filter,
            'date': today.isoformat()
        }
        
        return success_response(subscriptions_data, "Subscriptions retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve subscriptions: {str(e)}", 500)

@analytics_bp.route('/transactions-overview', methods=['GET'])
@require_auth
def get_transactions_overview():
    """Get transactions overview with income/expense totals and day-wise segregation"""
    try:
        user = get_current_user()
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Parameters
        days_back = int(request.args.get('days_back', 30))  # Default last 30 days
        transaction_type_filter = request.args.get('type', 'all')  # all, income, expense
        
        # Calculate date range
        start_date = today - timedelta(days=days_back)
        
        # Get all transactions in range
        transactions_query = supabase_client.table('transactions').select('*').eq('user_id', user['id'])
        transactions_query = transactions_query.gte('date', start_date.isoformat()).lte('date', today.isoformat())
        
        # Apply transaction type filter
        if transaction_type_filter == 'income':
            transactions_query = transactions_query.eq('transaction_type', 'income')
        elif transaction_type_filter == 'expense':
            transactions_query = transactions_query.eq('transaction_type', 'expense')
            
        transactions_result = transactions_query.order('date', desc=True).order('created_at', desc=True).execute()
        
        # Calculate totals
        total_income = sum(float(t['amount']) for t in transactions_result.data if t['transaction_type'] == 'income')
        total_expense = sum(float(t['amount']) for t in transactions_result.data if t['transaction_type'] == 'expense')
        net_amount = total_income - total_expense
        
        # Group transactions by date
        transactions_by_date = defaultdict(list)
        for transaction in transactions_result.data:
            transaction_date = datetime.fromisoformat(transaction['date']).date()
            
            # Format transaction with time
            transaction_time = datetime.fromisoformat(transaction['date']).strftime('%I:%M %p')
            
            transaction_info = {
                'id': transaction['id'],
                'description': transaction['description'],
                'amount': float(transaction['amount']),
                'transaction_type': transaction['transaction_type'],
                'category': transaction['category_name'],
                'time': transaction_time,
                'date': transaction['date'],
                'merchant': transaction.get('merchant'),
                'location': transaction.get('location'),
                'notes': transaction.get('notes'),
                'source': transaction['source'],
                'tags': transaction.get('tags', []),
                'created_at': transaction['created_at']
            }
            
            transactions_by_date[transaction_date].append(transaction_info)
        
        # Create day-wise segregated transactions
        segregated_transactions = []
        
        # Sort dates in descending order (most recent first)
        sorted_dates = sorted(transactions_by_date.keys(), reverse=True)
        
        for transaction_date in sorted_dates:
            # Determine day label
            if transaction_date == today:
                day_label = "Today"
            elif transaction_date == yesterday:
                day_label = "Yesterday"
            else:
                day_label = transaction_date.strftime('%B %d, %Y')  # e.g., "January 17, 2024"
            
            # Calculate day totals
            day_transactions = transactions_by_date[transaction_date]
            day_income = sum(t['amount'] for t in day_transactions if t['transaction_type'] == 'income')
            day_expense = sum(t['amount'] for t in day_transactions if t['transaction_type'] == 'expense')
            day_net = day_income - day_expense
            
            day_data = {
                'date': transaction_date.isoformat(),
                'day_label': day_label,
                'transaction_count': len(day_transactions),
                'day_income': day_income,
                'day_expense': day_expense,
                'day_net': day_net,
                'transactions': sorted(day_transactions, key=lambda x: x['date'], reverse=True)  # Sort by time within day
            }
            
            segregated_transactions.append(day_data)
        
        # Category breakdown
        category_income = defaultdict(float)
        category_expense = defaultdict(float)
        for transaction in transactions_result.data:
            category = transaction['category_name']
            amount = float(transaction['amount'])
            if transaction['transaction_type'] == 'income':
                category_income[category] += amount
            else:
                category_expense[category] += amount
        
        # Top categories
        top_income_categories = sorted(category_income.items(), key=lambda x: x[1], reverse=True)[:5]
        top_expense_categories = sorted(category_expense.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Recent high-value transactions
        high_value_threshold = 1000  # Transactions above ₹1000
        high_value_transactions = [
            t for t in transactions_result.data 
            if float(t['amount']) >= high_value_threshold
        ]
        high_value_transactions = sorted(high_value_transactions, key=lambda x: float(x['amount']), reverse=True)[:10]
        
        # Summary statistics
        summary = {
            'total_income': total_income,
            'total_expense': total_expense,
            'net_amount': net_amount,
            'transaction_count': len(transactions_result.data),
            'income_transactions': len([t for t in transactions_result.data if t['transaction_type'] == 'income']),
            'expense_transactions': len([t for t in transactions_result.data if t['transaction_type'] == 'expense']),
            'average_income': total_income / len([t for t in transactions_result.data if t['transaction_type'] == 'income']) if any(t['transaction_type'] == 'income' for t in transactions_result.data) else 0,
            'average_expense': total_expense / len([t for t in transactions_result.data if t['transaction_type'] == 'expense']) if any(t['transaction_type'] == 'expense' for t in transactions_result.data) else 0,
            'days_with_transactions': len(segregated_transactions),
            'highest_expense': max([float(t['amount']) for t in transactions_result.data if t['transaction_type'] == 'expense'], default=0),
            'highest_income': max([float(t['amount']) for t in transactions_result.data if t['transaction_type'] == 'income'], default=0),
            'top_income_categories': [{'category': cat, 'amount': amount} for cat, amount in top_income_categories],
            'top_expense_categories': [{'category': cat, 'amount': amount} for cat, amount in top_expense_categories]
        }
        
        # Categories for filtering
        categories = [
            {
                'id': 'all',
                'name': 'All Transactions',
                'display_name': f'All Transactions ({summary["transaction_count"]})',
                'count': summary['transaction_count'],
                'amount': abs(net_amount),
                'filter': 'all',
                'icon': '💰',
                'color': '#6B7280'
            },
            {
                'id': 'income',
                'name': 'Income',
                'display_name': f'Income ({summary["income_transactions"]})',
                'count': summary['income_transactions'],
                'amount': total_income,
                'filter': 'income',
                'icon': '💚',
                'color': '#10B981'
            },
            {
                'id': 'expense',
                'name': 'Expenses',
                'display_name': f'Expenses ({summary["expense_transactions"]})',
                'count': summary['expense_transactions'],
                'amount': total_expense,
                'filter': 'expense',
                'icon': '💸',
                'color': '#EF4444'
            }
        ]
        
        transactions_overview_data = {
            'segregated_transactions': segregated_transactions,
            'summary': summary,
            'categories': categories,
            'high_value_transactions': high_value_transactions[:5],  # Top 5 high-value
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': today.isoformat(),
                'days_back': days_back
            },
            'filter_applied': transaction_type_filter,
            'date': today.isoformat()
        }
        
        return success_response(transactions_overview_data, "Transactions overview retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve transactions overview: {str(e)}", 500)

@analytics_bp.route('/budgets-overview', methods=['GET'])
@require_auth
def get_budgets_overview():
    """Get budgets overview with circular progress and category breakdown for frontend"""
    try:
        user = get_current_user()
        today = date.today()
        
        # Get current month date range
        month_start = today.replace(day=1)
        # Calculate next month start for end date
        if today.month == 12:
            month_end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        
        # Days left in current month
        days_left_in_month = (month_end - today).days + 1
        
        # Get active budgets for current month
        budgets_query = supabase_client.table('budgets').select('*').eq('user_id', user['id']).eq('is_active', True)
        budgets_query = budgets_query.lte('start_date', today.isoformat()).gte('end_date', today.isoformat())
        budgets_result = budgets_query.execute()
        
        # Get current month transactions for spending calculations
        month_transactions = supabase_client.table('transactions').select('*').eq('user_id', user['id'])
        month_transactions = month_transactions.eq('transaction_type', 'expense')
        month_transactions = month_transactions.gte('date', month_start.isoformat()).lte('date', today.isoformat())
        transactions_result = month_transactions.execute()
        
        # Calculate spending by category
        category_spending = defaultdict(float)
        for transaction in transactions_result.data:
            category_spending[transaction['category_name']] += float(transaction['amount'])
        
        # Process budget cards
        budget_cards = []
        total_budget_amount = 0
        total_spent_amount = 0
        
        for budget in budgets_result.data:
            budget_amount = float(budget['amount'])
            category = budget.get('category_id')  # This might be None for general budgets
            
            # Calculate spent amount for this budget
            if category:
                # Category-specific budget
                spent_amount = category_spending.get(budget['name'], 0)  # Using budget name as fallback
            else:
                # General budget - use budget name to match category
                spent_amount = category_spending.get(budget['name'], 0)
            
            # Calculate progress
            percentage_spent = (spent_amount / budget_amount * 100) if budget_amount > 0 else 0
            amount_left = budget_amount - spent_amount
            
            # Determine status and color
            if percentage_spent >= 90:
                status = 'critical'
                color = '#EF4444'  # Red
            elif percentage_spent >= 70:
                status = 'warning'
                color = '#F59E0B'  # Orange
            else:
                status = 'good'
                color = '#10B981'  # Green
            
            # Budget card data matching frontend design
            budget_card = {
                'id': budget['id'],
                'name': budget['name'],
                'category': budget['name'],  # Using name as category for display
                'icon': _get_category_icon(budget['name']),
                'budget_amount': budget_amount,
                'spent_amount': spent_amount,
                'amount_left': amount_left,
                'percentage_spent': round(percentage_spent, 1),
                'days_left': days_left_in_month,
                'status': status,
                'color': color,
                'progress_color': _get_progress_color(percentage_spent),
                'alert_threshold': budget.get('alert_threshold', 80),
                'period': budget['period'],
                'created_at': budget['created_at']
            }
            
            budget_cards.append(budget_card)
            total_budget_amount += budget_amount
            total_spent_amount += spent_amount
        
        # Overall spending calculation
        overall_percentage_spent = (total_spent_amount / total_budget_amount * 100) if total_budget_amount > 0 else 0
        overall_amount_left = total_budget_amount - total_spent_amount
        
        # Create overall spending data for circular progress
        overall_spending = {
            'percentage_spent': round(overall_percentage_spent, 1),
            'amount_left': overall_amount_left,
            'total_budget': total_budget_amount,
            'total_spent': total_spent_amount,
            'days_left': days_left_in_month,
            'month_name': today.strftime('%B'),
            'year': today.year,
            'status': 'critical' if overall_percentage_spent >= 90 else 'warning' if overall_percentage_spent >= 70 else 'good'
        }
        
        # Budget categories for creating new budgets (matching frontend categories)
        available_categories = [
            {'id': 'food', 'name': 'Food', 'icon': '🍔', 'color': '#FF6B35'},
            {'id': 'groceries', 'name': 'Groceries', 'icon': '🛒', 'color': '#4ECDC4'},
            {'id': 'subscriptions', 'name': 'Subscriptions', 'icon': '📱', 'color': '#45B7D1'},
            {'id': 'transportation', 'name': 'Transportation', 'icon': '🚗', 'color': '#96CEB4'},
            {'id': 'entertainment', 'name': 'Entertainment', 'icon': '🎬', 'color': '#FFEAA7'},
            {'id': 'shopping', 'name': 'Shopping', 'icon': '🛍️', 'color': '#DDA0DD'},
            {'id': 'healthcare', 'name': 'Healthcare', 'icon': '🏥', 'color': '#74B9FF'},
            {'id': 'bills', 'name': 'Bills & Utilities', 'icon': '⚡', 'color': '#A29BFE'}
        ]
        
        # Summary statistics
        summary = {
            'total_budgets': len(budget_cards),
            'active_budgets': len([b for b in budget_cards if b['status'] != 'critical']),
            'over_budget_count': len([b for b in budget_cards if b['percentage_spent'] > 100]),
            'warning_budgets': len([b for b in budget_cards if b['status'] == 'warning']),
            'average_spending_percentage': round(sum(b['percentage_spent'] for b in budget_cards) / len(budget_cards), 1) if budget_cards else 0,
            'projected_monthly_spending': total_spent_amount * (30 / today.day) if today.day > 0 else 0
        }
        
        budgets_overview_data = {
            'overall_spending': overall_spending,
            'budget_cards': budget_cards,
            'available_categories': available_categories,
            'summary': summary,
            'month_info': {
                'current_month': today.strftime('%B %Y'),
                'days_left': days_left_in_month,
                'days_elapsed': today.day,
                'total_days': (month_end - month_start).days + 1
            },
            'date': today.isoformat()
        }
        
        return success_response(budgets_overview_data, "Budgets overview retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve budgets overview: {str(e)}", 500)

def _get_category_icon(category_name):
    """Get icon for category based on name"""
    category_icons = {
        'Food': '🍔',
        'Groceries': '🛒', 
        'Subscriptions': '📱',
        'Transportation': '🚗',
        'Entertainment': '🎬',
        'Shopping': '🛍️',
        'Healthcare': '🏥',
        'Bills': '⚡'
    }
    return category_icons.get(category_name, '💰')

def _get_progress_color(percentage_spent):
    """Get progress bar color based on spending percentage"""
    if percentage_spent >= 90:
        return '#EF4444'  # Red
    elif percentage_spent >= 70:
        return '#F59E0B'  # Orange
    elif percentage_spent >= 50:
        return '#3B82F6'  # Blue
    else:
        return '#10B981'  # Green

@analytics_bp.route('/insights', methods=['GET'])
@require_auth
def get_money_insights():
    """Get money insights with spending analysis and budget advice matching frontend design"""
    try:
        user = get_current_user()
        
        # Get user timezone
        user_timezone = user.get('timezone', 'Asia/Kolkata')
        tz = pytz.timezone(user_timezone)
        now_local = datetime.now(tz)
        today_local = now_local.date()
        
        # Get timezone-aware month boundaries
        month_start_utc, month_end_utc = get_month_boundaries(today_local, user_timezone)
        
        # Get last month boundaries
        if today_local.month == 1:
            last_month_date = today_local.replace(year=today_local.year - 1, month=12)
        else:
            last_month_date = today_local.replace(month=today_local.month - 1)
        
        last_month_start_utc, last_month_end_utc = get_month_boundaries(last_month_date, user_timezone)
        
        # Get current month transactions (timezone-aware)
        current_month_transactions = supabase_client.table('transactions').select('*').eq('user_id', user['id'])
        current_month_transactions = current_month_transactions.eq('transaction_type', 'expense')
        current_month_transactions = current_month_transactions.gte('created_at', month_start_utc.isoformat()).lte('created_at', month_end_utc.isoformat())
        current_transactions = current_month_transactions.execute()
        
        # Get last month transactions for comparison (timezone-aware)
        last_month_transactions = supabase_client.table('transactions').select('*').eq('user_id', user['id'])
        last_month_transactions = last_month_transactions.eq('transaction_type', 'expense')
        last_month_transactions = last_month_transactions.gte('created_at', last_month_start_utc.isoformat()).lte('created_at', last_month_end_utc.isoformat())
        last_transactions = last_month_transactions.execute()
        
        # Calculate spending totals
        current_month_spending = sum(float(t['amount']) for t in current_transactions.data)
        last_month_spending = sum(float(t['amount']) for t in last_transactions.data)
        
        # Calculate comparison
        if last_month_spending > 0:
            spending_change_percentage = ((current_month_spending - last_month_spending) / last_month_spending) * 100
        else:
            spending_change_percentage = 100 if current_month_spending > 0 else 0
        
        # Determine comparison text
        if abs(spending_change_percentage) < 5:
            comparison_text = "About the same as last month"
            comparison_icon = "➡️"
        elif spending_change_percentage > 0:
            comparison_text = f"{abs(spending_change_percentage):.0f}% more than last month"
            comparison_icon = "📈"
        else:
            comparison_text = f"{abs(spending_change_percentage):.0f}% less than last month"
            comparison_icon = "📉"
        
        # Calculate daily average (current month) - more accurate calculation
        month_start_date = month_start_utc.astimezone(tz).date()
        days_elapsed = (today_local - month_start_date).days + 1
        daily_average = current_month_spending / days_elapsed if days_elapsed > 0 else 0
        
        # Find top spending category
        category_spending = defaultdict(float)
        for transaction in current_transactions.data:
            category_spending[transaction['category_name']] += float(transaction['amount'])
        
        if category_spending:
            top_category = max(category_spending.items(), key=lambda x: x[1])
            top_category_name = top_category[0]
            top_category_amount = top_category[1]
        else:
            top_category_name = "Food"
            top_category_amount = 0
        
        # Get active budgets for advice (budgets that are active and cover current date)
        active_budgets = supabase_client.table('budgets').select('*').eq('user_id', user['id']).eq('is_active', True)
        active_budgets = active_budgets.lte('start_date', today_local.isoformat()).gte('end_date', today_local.isoformat())
        budgets_result = active_budgets.execute()
        
        # Calculate budget advice
        total_budget = sum(float(b['amount']) for b in budgets_result.data)
        budget_used_percentage = (current_month_spending / total_budget * 100) if total_budget > 0 else 0
        
        # Days left in month (timezone-aware)
        month_end_date = month_end_utc.astimezone(tz).date()
        days_left = (month_end_date - today_local).days + 1
        
        # Calculate spending advice
        if total_budget > 0:
            remaining_budget = total_budget - current_month_spending
            daily_allowance = remaining_budget / days_left if days_left > 0 else 0
            
            if budget_used_percentage < 50:
                advice_message = "You're doing great! You can spend a bit more."
                advice_color = "#10B981"
                advice_icon = "😊"
            elif budget_used_percentage < 80:
                advice_message = "You're on track! Keep monitoring your spending."
                advice_color = "#3B82F6"
                advice_icon = "👍"
            elif budget_used_percentage < 100:
                advice_message = "Be careful! You're approaching your budget limit."
                advice_color = "#F59E0B"
                advice_icon = "⚠️"
            else:
                advice_message = "You've exceeded your budget! Consider reducing spending."
                advice_color = "#EF4444"
                advice_icon = "🚨"
            
            daily_advice = f"You can spend ₹{daily_allowance:.0f} per day for the next {days_left} days"
        else:
            advice_message = "Set up budgets to get personalized spending advice!"
            advice_color = "#6B7280"
            advice_icon = "💡"
            daily_advice = "Create budgets to track your spending better"
            daily_allowance = 0
        
        # This month insights
        this_month_insight = {
            'amount': current_month_spending,
            'currency_symbol': '₹',
            'comparison': {
                'text': comparison_text,
                'icon': comparison_icon,
                'percentage_change': spending_change_percentage
            }
        }
        
        # Daily average and top category
        daily_average_insight = {
            'amount': daily_average,
            'currency_symbol': '₹',
            'label': 'Daily Average',
            'icon': '📅'
        }
        
        top_category_insight = {
            'category': top_category_name,
            'amount': top_category_amount,
            'currency_symbol': '₹',
            'label': f'Top: {top_category_name}',
            'icon': '🏆'
        }
        
        # Budget advice section
        budget_advice = {
            'message': advice_message,
            'daily_advice': daily_advice,
            'color': advice_color,
            'icon': advice_icon,
            'daily_allowance': daily_allowance,
            'days_left': days_left,
            'budget_used_percentage': budget_used_percentage
        }
        
        # Quick actions (suggested actions based on spending patterns)
        quick_actions = []
        
        if daily_average > daily_allowance and total_budget > 0:
            quick_actions.append({
                'id': 'reduce_spending',
                'title': 'Review Expenses',
                'description': 'Look at recent transactions to identify savings',
                'icon': '🔍',
                'action_type': 'navigate',
                'target': 'transactions'
            })
        
        if len(budgets_result.data) == 0:
            quick_actions.append({
                'id': 'create_budget',
                'title': 'Create Budget',
                'description': 'Set spending limits for better control',
                'icon': '🎯',
                'action_type': 'navigate', 
                'target': 'budgets'
            })
        
        if current_month_spending > last_month_spending * 1.2:  # 20% increase
            quick_actions.append({
                'id': 'spending_alert',
                'title': 'High Spending Alert',
                'description': 'Your spending increased significantly this month',
                'icon': '📊',
                'action_type': 'info'
            })
        
        # If no specific actions, add general ones
        if not quick_actions:
            quick_actions = [
                {
                    'id': 'add_transaction',
                    'title': 'Add Transaction',
                    'description': 'Record a new expense or income',
                    'icon': '➕',
                    'action_type': 'navigate',
                    'target': 'add_transaction'
                },
                {
                    'id': 'view_analytics',
                    'title': 'View Analytics',
                    'description': 'See detailed spending breakdown',
                    'icon': '📈',
                    'action_type': 'navigate',
                    'target': 'analytics'
                }
            ]
        
        insights_data = {
            'this_month': this_month_insight,
            'daily_average': daily_average_insight,
            'top_category': top_category_insight,
            'budget_advice': budget_advice,
            'quick_actions': quick_actions,
            'month_info': {
                'current_month': today_local.strftime('%B %Y'),
                'days_elapsed': days_elapsed,
                'days_left': days_left,
                'total_days': (month_end_date - month_start_date).days + 1
            },
            'date': today_local.isoformat()
        }
        
        return success_response(insights_data, "Money insights retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve money insights: {str(e)}", 500)

@analytics_bp.route('/dashboard', methods=['GET'])
@require_auth
def get_dashboard_data():
    """Get comprehensive dashboard data for the user"""
    try:
        user = get_current_user()
        
        # Get current month data
        today = date.today()
        month_start = today.replace(day=1)
        month_end = today
        
        # Transaction summary for current month
        transactions_query = supabase_client.table('transactions').select('*').eq('user_id', user['id'])
        transactions_query = transactions_query.gte('date', month_start.isoformat()).lte('date', month_end.isoformat())
        transactions_result = transactions_query.execute()
        
        total_income = sum(float(t['amount']) for t in transactions_result.data if t['transaction_type'] == 'income')
        total_expense = sum(float(t['amount']) for t in transactions_result.data if t['transaction_type'] == 'expense')
        
        # Recent transactions (last 5)
        recent_transactions = supabase_client.table('transactions').select('*').eq('user_id', user['id']).order('created_at', desc=True).limit(5).execute()
        
        # Upcoming bills (next 7 days)
        next_week = today + timedelta(days=7)
        upcoming_bills = supabase_client.table('bills').select('*').eq('user_id', user['id']).eq('is_paid', False)
        upcoming_bills = upcoming_bills.gte('due_date', today.isoformat()).lte('due_date', next_week.isoformat()).execute()
        
        # Active budgets with spending
        budgets_result = supabase_client.table('budgets').select('*').eq('user_id', user['id']).eq('is_active', True).execute()
        budgets_summary = []
        
        for budget in budgets_result.data:
            # Calculate spending for this budget
            budget_query = supabase_client.table('transactions').select('amount').eq('user_id', user['id']).eq('transaction_type', 'expense')
            budget_query = budget_query.gte('date', budget['start_date']).lte('date', budget['end_date'])
            
            if budget.get('category_id'):
                budget_query = budget_query.eq('category_id', budget['category_id'])
            
            budget_transactions = budget_query.execute()
            spent_amount = sum(float(t['amount']) for t in budget_transactions.data)
            budget_amount = float(budget['amount'])
            
            budgets_summary.append({
                'id': budget['id'],
                'name': budget['name'],
                'amount': budget_amount,
                'spent': spent_amount,
                'percentage': (spent_amount / budget_amount * 100) if budget_amount > 0 else 0
            })
        
        # Goals progress
        goals_result = supabase_client.table('goals').select('*').eq('user_id', user['id']).eq('is_completed', False).limit(3).execute()
        goals_summary = []
        
        for goal in goals_result.data:
            current_amount = float(goal['current_amount'])
            target_amount = float(goal['target_amount'])
            
            goals_summary.append({
                'id': goal['id'],
                'title': goal['title'],
                'current_amount': current_amount,
                'target_amount': target_amount,
                'progress_percentage': (current_amount / target_amount * 100) if target_amount > 0 else 0
            })
        
        dashboard_data = {
            'summary': {
                'current_month_income': total_income,
                'current_month_expense': total_expense,
                'current_month_balance': total_income - total_expense,
                'transaction_count': len(transactions_result.data)
            },
            'recent_transactions': recent_transactions.data,
            'upcoming_bills': {
                'count': len(upcoming_bills.data),
                'total_amount': sum(float(b['amount']) for b in upcoming_bills.data),
                'bills': upcoming_bills.data
            },
            'budgets_overview': {
                'active_count': len(budgets_summary),
                'budgets': budgets_summary
            },
            'goals_progress': goals_summary
        }
        
        return success_response(dashboard_data, "Dashboard data retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve dashboard data: {str(e)}", 500)

@analytics_bp.route('/spending-trends', methods=['GET'])
@require_auth
def get_spending_trends():
    """Get spending trends over time with category breakdown"""
    try:
        user = get_current_user()
        
        # Parameters
        period = request.args.get('period', 'month')  # month, quarter, year
        months_back = int(request.args.get('months_back', 6))
        
        # Calculate date range
        end_date = date.today()
        start_date = end_date - timedelta(days=months_back * 30)
        
        # Get transactions
        transactions_query = supabase_client.table('transactions').select('*').eq('user_id', user['id']).eq('transaction_type', 'expense')
        transactions_query = transactions_query.gte('date', start_date.isoformat()).lte('date', end_date.isoformat())
        transactions_result = transactions_query.execute()
        
        # Group by month and category
        monthly_spending = defaultdict(lambda: defaultdict(float))
        category_totals = defaultdict(float)
        
        for transaction in transactions_result.data:
            transaction_date = datetime.fromisoformat(transaction['date']).date()
            month_key = transaction_date.strftime('%Y-%m')
            category = transaction['category_name']
            amount = float(transaction['amount'])
            
            monthly_spending[month_key][category] += amount
            category_totals[category] += amount
        
        # Prepare timeline data
        timeline = []
        current_date = start_date.replace(day=1)
        
        while current_date <= end_date:
            month_key = current_date.strftime('%Y-%m')
            month_name = current_date.strftime('%B %Y')
            month_total = sum(monthly_spending[month_key].values())
            
            timeline.append({
                'month': month_key,
                'month_name': month_name,
                'total_spending': month_total,
                'categories': dict(monthly_spending[month_key])
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        # Top categories
        top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:10]
        
        trends_data = {
            'period': period,
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'timeline': timeline,
            'top_categories': [{'category': cat, 'total': amount} for cat, amount in top_categories],
            'total_spending': sum(category_totals.values()),
            'average_monthly': sum(category_totals.values()) / months_back if months_back > 0 else 0
        }
        
        return success_response(trends_data, "Spending trends retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve spending trends: {str(e)}", 500)

@analytics_bp.route('/category-analysis', methods=['GET'])
@require_auth
def get_category_analysis():
    """Get detailed category-wise spending analysis"""
    try:
        user = get_current_user()
        
        # Parameters
        period = request.args.get('period', 'month')
        category = request.args.get('category')
        
        # Calculate date range
        if period == 'week':
            start_date = date.today() - timedelta(days=7)
        elif period == 'month':
            start_date = date.today().replace(day=1)
        elif period == 'quarter':
            current_month = date.today().month
            quarter_start_month = ((current_month - 1) // 3) * 3 + 1
            start_date = date.today().replace(month=quarter_start_month, day=1)
        else:  # year
            start_date = date.today().replace(month=1, day=1)
        
        end_date = date.today()
        
        # Get transactions
        transactions_query = supabase_client.table('transactions').select('*').eq('user_id', user['id'])
        transactions_query = transactions_query.gte('date', start_date.isoformat()).lte('date', end_date.isoformat())
        
        if category:
            transactions_query = transactions_query.eq('category_name', category)
        
        transactions_result = transactions_query.execute()
        
        # Analyze by category
        category_analysis = defaultdict(lambda: {
            'total_income': 0,
            'total_expense': 0,
            'transaction_count': 0,
            'average_transaction': 0,
            'transactions': []
        })
        
        for transaction in transactions_result.data:
            cat = transaction['category_name']
            amount = float(transaction['amount'])
            
            if transaction['transaction_type'] == 'income':
                category_analysis[cat]['total_income'] += amount
            else:
                category_analysis[cat]['total_expense'] += amount
            
            category_analysis[cat]['transaction_count'] += 1
            category_analysis[cat]['transactions'].append(transaction)
        
        # Calculate averages and sort
        analysis_results = []
        for cat, data in category_analysis.items():
            total_amount = data['total_income'] + data['total_expense']
            analysis_results.append({
                'category': cat,
                'total_income': data['total_income'],
                'total_expense': data['total_expense'],
                'net_amount': data['total_income'] - data['total_expense'],
                'transaction_count': data['transaction_count'],
                'average_transaction': total_amount / data['transaction_count'] if data['transaction_count'] > 0 else 0,
                'transactions': sorted(data['transactions'], key=lambda x: x['date'], reverse=True)[:5]  # Last 5 transactions
            })
        
        # Sort by total expense (descending)
        analysis_results.sort(key=lambda x: x['total_expense'], reverse=True)
        
        total_income = sum(float(t['amount']) for t in transactions_result.data if t['transaction_type'] == 'income')
        total_expense = sum(float(t['amount']) for t in transactions_result.data if t['transaction_type'] == 'expense')
        
        analysis_data = {
            'period': period,
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'summary': {
                'total_income': total_income,
                'total_expense': total_expense,
                'net_amount': total_income - total_expense,
                'total_transactions': len(transactions_result.data)
            },
            'categories': analysis_results
        }
        
        return success_response(analysis_data, "Category analysis retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve category analysis: {str(e)}", 500)

@analytics_bp.route('/financial-health', methods=['GET'])
@require_auth
def get_financial_health():
    """Calculate financial health score and provide insights"""
    try:
        user = get_current_user()
        
        # Get data for last 6 months
        end_date = date.today()
        start_date = end_date - timedelta(days=180)
        
        # Get transactions
        transactions_query = supabase_client.table('transactions').select('*').eq('user_id', user['id'])
        transactions_query = transactions_query.gte('date', start_date.isoformat()).lte('date', end_date.isoformat())
        transactions_result = transactions_query.execute()
        
        total_income = sum(float(t['amount']) for t in transactions_result.data if t['transaction_type'] == 'income')
        total_expense = sum(float(t['amount']) for t in transactions_result.data if t['transaction_type'] == 'expense')
        
        # Get savings goals
        goals_result = supabase_client.table('goals').select('*').eq('user_id', user['id']).execute()
        total_savings_target = sum(float(g['target_amount']) for g in goals_result.data)
        total_current_savings = sum(float(g['current_amount']) for g in goals_result.data)
        
        # Get active budgets
        budgets_result = supabase_client.table('budgets').select('*').eq('user_id', user['id']).eq('is_active', True).execute()
        
        # Calculate health factors
        factors = {}
        
        # 1. Savings Rate (0-30 points)
        savings_rate = ((total_income - total_expense) / total_income * 100) if total_income > 0 else 0
        if savings_rate >= 20:
            factors['savings_rate'] = 30
        elif savings_rate >= 10:
            factors['savings_rate'] = 20
        elif savings_rate >= 5:
            factors['savings_rate'] = 10
        else:
            factors['savings_rate'] = 0
        
        # 2. Budget Adherence (0-25 points)
        if budgets_result.data:
            over_budget_count = 0
            for budget in budgets_result.data:
                # Quick budget check
                budget_spent = 0  # Simplified - would need proper calculation
                if budget_spent > float(budget['amount']):
                    over_budget_count += 1
            
            adherence_rate = (1 - over_budget_count / len(budgets_result.data)) * 100
            factors['budget_adherence'] = min(25, adherence_rate / 4)
        else:
            factors['budget_adherence'] = 0
        
        # 3. Goal Progress (0-20 points)
        if total_savings_target > 0:
            goal_progress = (total_current_savings / total_savings_target * 100)
            factors['goal_progress'] = min(20, goal_progress / 5)
        else:
            factors['goal_progress'] = 0
        
        # 4. Spending Consistency (0-15 points)
        # Calculate variance in monthly spending
        monthly_expenses = defaultdict(float)
        for transaction in transactions_result.data:
            if transaction['transaction_type'] == 'expense':
                month = datetime.fromisoformat(transaction['date']).strftime('%Y-%m')
                monthly_expenses[month] += float(transaction['amount'])
        
        if len(monthly_expenses) > 1:
            amounts = list(monthly_expenses.values())
            avg_spending = sum(amounts) / len(amounts)
            variance = sum((x - avg_spending) ** 2 for x in amounts) / len(amounts)
            consistency_score = max(0, 15 - (variance / avg_spending * 10)) if avg_spending > 0 else 0
            factors['spending_consistency'] = consistency_score
        else:
            factors['spending_consistency'] = 10
        
        # 5. Emergency Fund (0-10 points)
        emergency_fund_goal = total_expense * 3  # 3 months of expenses
        emergency_fund_ratio = total_current_savings / emergency_fund_goal if emergency_fund_goal > 0 else 0
        factors['emergency_fund'] = min(10, emergency_fund_ratio * 10)
        
        # Calculate total score
        total_score = sum(factors.values())
        
        # Generate recommendations
        recommendations = []
        if factors['savings_rate'] < 15:
            recommendations.append("Try to save at least 10-20% of your income each month")
        if factors['budget_adherence'] < 15:
            recommendations.append("Review and adjust your budgets to be more realistic")
        if factors['goal_progress'] < 10:
            recommendations.append("Consider contributing more regularly to your savings goals")
        if factors['emergency_fund'] < 8:
            recommendations.append("Build an emergency fund covering 3-6 months of expenses")
        
        if total_score >= 75:
            health_status = "Excellent"
        elif total_score >= 60:
            health_status = "Good"
        elif total_score >= 40:
            health_status = "Fair"
        else:
            health_status = "Needs Improvement"
        
        health_data = {
            'score': round(total_score),
            'status': health_status,
            'factors': {
                'savings_rate': {
                    'score': round(factors['savings_rate']),
                    'max_score': 30,
                    'current_rate': round(savings_rate, 1)
                },
                'budget_adherence': {
                    'score': round(factors['budget_adherence']),
                    'max_score': 25,
                    'active_budgets': len(budgets_result.data)
                },
                'goal_progress': {
                    'score': round(factors['goal_progress']),
                    'max_score': 20,
                    'progress_percentage': round((total_current_savings / total_savings_target * 100) if total_savings_target > 0 else 0, 1)
                },
                'spending_consistency': {
                    'score': round(factors['spending_consistency']),
                    'max_score': 15
                },
                'emergency_fund': {
                    'score': round(factors['emergency_fund']),
                    'max_score': 10,
                    'current_amount': total_current_savings,
                    'recommended_amount': emergency_fund_goal
                }
            },
            'recommendations': recommendations,
            'last_calculated': datetime.utcnow().isoformat()
        }
        
        return success_response(health_data, "Financial health score calculated successfully")
        
    except Exception as e:
        return error_response(f"Failed to calculate financial health: {str(e)}", 500)