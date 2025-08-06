from flask import Blueprint, request, jsonify
from api.utils.auth_helpers import require_auth, get_current_user
from api.utils.response_helpers import success_response, error_response, paginated_response
from config import supabase_client
from datetime import datetime, date, timedelta
import uuid
import calendar

budgets_bp = Blueprint('budgets', __name__)

@budgets_bp.route('', methods=['GET'])
@require_auth
def get_budgets():
    """
    Get user's budgets with optional filtering
    Query parameters:
    - period: Filter by budget period (weekly, monthly, quarterly, yearly)
    - active: Filter by active status (true/false)
    - category_id: Filter by category ID
    """
    try:
        user = get_current_user()
        
        query = supabase_client.table('budgets').select('*').eq('user_id', user['id'])
        
        # Apply filters
        if request.args.get('period'):
            query = query.eq('period', request.args.get('period'))
        
        if request.args.get('active'):
            is_active = request.args.get('active').lower() == 'true'
            query = query.eq('is_active', is_active)
        
        if request.args.get('category_id'):
            query = query.eq('category_id', request.args.get('category_id'))
        
        result = query.order('created_at', desc=True).execute()
        
        # Enrich budget data with spending information
        enriched_budgets = []
        for budget in result.data:
            enriched_budget = calculate_budget_spending(budget, user['id'])
            enriched_budgets.append(enriched_budget)
        
        return success_response(enriched_budgets, "Budgets retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve budgets: {str(e)}", 500)

@budgets_bp.route('', methods=['POST'])
@require_auth
def create_budget():
    """
    Create a new budget
    Required fields: name, amount, period, start_date, end_date
    Optional fields: category_id, alert_threshold, color, icon
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'amount', 'period', 'start_date', 'end_date']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)
        
        # Validate period
        valid_periods = ['weekly', 'monthly', 'quarterly', 'yearly']
        if data['period'] not in valid_periods:
            return error_response(f"period must be one of: {', '.join(valid_periods)}", 400)
        
        # Validate dates
        try:
            start_date = datetime.fromisoformat(data['start_date']).date()
            end_date = datetime.fromisoformat(data['end_date']).date()
            
            if start_date >= end_date:
                return error_response("end_date must be after start_date", 400)
                
        except ValueError:
            return error_response("Invalid date format. Use YYYY-MM-DD", 400)
        
        # Prepare budget data
        budget_data = {
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'name': data['name'],
            'amount': float(data['amount']),
            'period': data['period'],
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'category_id': data.get('category_id'),
            'alert_threshold': data.get('alert_threshold', 80),
            'color': data.get('color'),
            'icon': data.get('icon'),
            'is_active': True,
            'spent_amount': 0,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Insert budget
        result = supabase_client.table('budgets').insert(budget_data).execute()
        
        if result.data:
            # Calculate spending for the new budget
            enriched_budget = calculate_budget_spending(result.data[0], user['id'])
            return success_response(enriched_budget, "Budget created successfully", 201)
        else:
            return error_response("Failed to create budget", 500)
            
    except Exception as e:
        return error_response(f"Failed to create budget: {str(e)}", 500)

@budgets_bp.route('/<budget_id>', methods=['GET'])
@require_auth
def get_budget(budget_id):
    """Get a specific budget by ID with detailed spending breakdown"""
    try:
        user = get_current_user()
        
        result = supabase_client.table('budgets').select('*').eq('id', budget_id).eq('user_id', user['id']).execute()
        
        if not result.data:
            return error_response("Budget not found", 404)
        
        budget = result.data[0]
        
        # Get detailed spending breakdown
        enriched_budget = calculate_budget_spending(budget, user['id'], include_transactions=True)
        
        return success_response(enriched_budget, "Budget retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve budget: {str(e)}", 500)

@budgets_bp.route('/<budget_id>', methods=['PUT'])
@require_auth
def update_budget(budget_id):
    """Update a specific budget"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Check if budget exists and belongs to user
        existing = supabase_client.table('budgets').select('*').eq('id', budget_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Budget not found", 404)
        
        # Prepare update data
        update_data = {}
        updatable_fields = ['name', 'amount', 'period', 'start_date', 'end_date', 
                           'category_id', 'alert_threshold', 'color', 'icon', 'is_active']
        
        for field in updatable_fields:
            if field in data:
                if field in ['start_date', 'end_date'] and data[field]:
                    # Validate date format
                    try:
                        date_value = datetime.fromisoformat(data[field]).date()
                        update_data[field] = date_value.isoformat()
                    except ValueError:
                        return error_response(f"Invalid date format for {field}. Use YYYY-MM-DD", 400)
                else:
                    update_data[field] = data[field]
        
        if update_data:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            result = supabase_client.table('budgets').update(update_data).eq('id', budget_id).execute()
            
            if result.data:
                enriched_budget = calculate_budget_spending(result.data[0], user['id'])
                return success_response(enriched_budget, "Budget updated successfully")
            else:
                return error_response("Failed to update budget", 500)
        else:
            return error_response("No valid fields to update", 400)
            
    except Exception as e:
        return error_response(f"Failed to update budget: {str(e)}", 500)

@budgets_bp.route('/<budget_id>', methods=['DELETE'])
@require_auth
def delete_budget(budget_id):
    """Delete a specific budget"""
    try:
        user = get_current_user()
        
        # Check if budget exists and belongs to user
        existing = supabase_client.table('budgets').select('*').eq('id', budget_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Budget not found", 404)
        
        # Delete budget
        result = supabase_client.table('budgets').delete().eq('id', budget_id).execute()
        
        return success_response(None, "Budget deleted successfully")
        
    except Exception as e:
        return error_response(f"Failed to delete budget: {str(e)}", 500)

@budgets_bp.route('/overview', methods=['GET'])
@require_auth
def get_budget_overview():
    """
    Get budget overview with spending summary
    Query parameters:
    - period: Filter by period (current_month, current_week, etc.)
    """
    try:
        user = get_current_user()
        
        # Get all active budgets
        budgets_result = supabase_client.table('budgets').select('*').eq('user_id', user['id']).eq('is_active', True).execute()
        
        if not budgets_result.data:
            return success_response({
                'total_budgets': 0,
                'total_budget_amount': 0,
                'total_spent': 0,
                'total_remaining': 0,
                'budgets_summary': []
            }, "No active budgets found")
        
        # Calculate overall statistics
        total_budget_amount = 0
        total_spent = 0
        budgets_summary = []
        over_budget_count = 0
        near_limit_count = 0
        
        for budget in budgets_result.data:
            enriched_budget = calculate_budget_spending(budget, user['id'])
            
            total_budget_amount += enriched_budget['amount']
            total_spent += enriched_budget['spent_amount']
            
            # Calculate status
            if enriched_budget['percentage_spent'] >= 100:
                over_budget_count += 1
                status = 'over_budget'
            elif enriched_budget['percentage_spent'] >= enriched_budget['alert_threshold']:
                near_limit_count += 1
                status = 'near_limit'
            else:
                status = 'on_track'
            
            budget_summary = {
                'id': enriched_budget['id'],
                'name': enriched_budget['name'],
                'amount': enriched_budget['amount'],
                'spent_amount': enriched_budget['spent_amount'],
                'remaining_amount': enriched_budget['remaining_amount'],
                'percentage_spent': enriched_budget['percentage_spent'],
                'days_remaining': enriched_budget['days_remaining'],
                'status': status,
                'color': enriched_budget['color'],
                'icon': enriched_budget['icon']
            }
            budgets_summary.append(budget_summary)
        
        # Sort by percentage spent (highest first)
        budgets_summary.sort(key=lambda x: x['percentage_spent'], reverse=True)
        
        overview = {
            'total_budgets': len(budgets_result.data),
            'total_budget_amount': total_budget_amount,
            'total_spent': total_spent,
            'total_remaining': total_budget_amount - total_spent,
            'overall_percentage': (total_spent / total_budget_amount * 100) if total_budget_amount > 0 else 0,
            'over_budget_count': over_budget_count,
            'near_limit_count': near_limit_count,
            'on_track_count': len(budgets_result.data) - over_budget_count - near_limit_count,
            'budgets_summary': budgets_summary
        }
        
        return success_response(overview, "Budget overview retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve budget overview: {str(e)}", 500)

def calculate_budget_spending(budget, user_id, include_transactions=False):
    """Calculate spending for a budget period"""
    try:
        # Get transactions within budget period
        query = supabase_client.table('transactions').select('*').eq('user_id', user_id).eq('transaction_type', 'expense')
        
        # Add date filters
        query = query.gte('date', budget['start_date']).lte('date', budget['end_date'])
        
        # Add category filter if budget has category
        if budget.get('category_id'):
            query = query.eq('category_id', budget['category_id'])
        
        transactions_result = query.execute()
        
        # Calculate spent amount
        spent_amount = sum(float(t['amount']) for t in transactions_result.data)
        
        # Calculate remaining amount
        budget_amount = float(budget['amount'])
        remaining_amount = budget_amount - spent_amount
        
        # Calculate percentage spent
        percentage_spent = (spent_amount / budget_amount * 100) if budget_amount > 0 else 0
        
        # Calculate days remaining
        end_date = datetime.fromisoformat(budget['end_date']).date()
        today = date.today()
        days_remaining = (end_date - today).days if end_date > today else 0
        
        # Calculate daily average (for insight)
        start_date = datetime.fromisoformat(budget['start_date']).date()
        total_days = (end_date - start_date).days + 1
        days_elapsed = (today - start_date).days + 1 if today >= start_date else 0
        
        daily_average = spent_amount / days_elapsed if days_elapsed > 0 else 0
        projected_spending = daily_average * total_days if days_elapsed > 0 else 0
        
        # Prepare enriched budget data
        enriched_budget = dict(budget)
        enriched_budget.update({
            'spent_amount': spent_amount,
            'remaining_amount': remaining_amount,
            'percentage_spent': round(percentage_spent, 2),
            'days_remaining': days_remaining,
            'daily_average': daily_average,
            'projected_spending': projected_spending,
            'is_over_budget': spent_amount > budget_amount,
            'is_near_limit': percentage_spent >= budget.get('alert_threshold', 80),
            'total_days': total_days,
            'days_elapsed': days_elapsed
        })
        
        if include_transactions:
            enriched_budget['transactions'] = transactions_result.data
        
        return enriched_budget
        
    except Exception as e:
        # Return budget with zero spending if calculation fails
        enriched_budget = dict(budget)
        enriched_budget.update({
            'spent_amount': 0,
            'remaining_amount': float(budget['amount']),
            'percentage_spent': 0,
            'days_remaining': 0,
            'daily_average': 0,
            'projected_spending': 0,
            'is_over_budget': False,
            'is_near_limit': False,
            'error': f"Failed to calculate spending: {str(e)}"
        })
        return enriched_budget

@budgets_bp.route('/templates', methods=['GET'])
@require_auth
def get_budget_templates():
    """Get predefined budget templates for quick setup"""
    templates = [
        {
            'name': 'Monthly Food Budget',
            'category': 'Food & Dining',
            'period': 'monthly',
            'suggested_amount': 500,
            'color': '#FF6B35',
            'icon': '🍔'
        },
        {
            'name': 'Transportation Budget',
            'category': 'Transportation',
            'period': 'monthly',
            'suggested_amount': 300,
            'color': '#4ECDC4',
            'icon': '🚗'
        },
        {
            'name': 'Entertainment Budget',
            'category': 'Entertainment',
            'period': 'monthly',
            'suggested_amount': 200,
            'color': '#96CEB4',
            'icon': '🎬'
        },
        {
            'name': 'Shopping Budget',
            'category': 'Shopping',
            'period': 'monthly',
            'suggested_amount': 400,
            'color': '#45B7D1',
            'icon': '🛍️'
        },
        {
            'name': 'Bills & Utilities',
            'category': 'Bills & Utilities',
            'period': 'monthly',
            'suggested_amount': 1000,
            'color': '#FFEAA7',
            'icon': '⚡'
        }
    ]
    
    return success_response(templates, "Budget templates retrieved successfully")