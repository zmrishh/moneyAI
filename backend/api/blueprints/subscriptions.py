from flask import Blueprint, request
from api.utils.auth_helpers import require_auth, get_current_user
from api.utils.response_helpers import success_response, error_response
from config import supabase_client
from datetime import datetime, date, timedelta
import uuid

subscriptions_bp = Blueprint('subscriptions', __name__)

@subscriptions_bp.route('', methods=['GET'])
@require_auth
def get_subscriptions():
    """Get user's subscriptions with price change history"""
    try:
        user = get_current_user()
        
        query = supabase_client.table('subscriptions').select('*').eq('user_id', user['id'])
        
        # Apply filters
        if request.args.get('is_active'):
            is_active = request.args.get('is_active').lower() == 'true'
            query = query.eq('is_active', is_active)
        
        if request.args.get('category'):
            query = query.eq('category', request.args.get('category'))
        
        result = query.order('next_billing_date').execute()
        
        # Enrich subscriptions with additional data
        enriched_subscriptions = []
        today = date.today()
        
        for subscription in result.data:
            # Get price changes with user_id filter
            price_changes_result = supabase_client.table('price_changes').select('*').eq('subscription_id', subscription['id']).eq('user_id', user['id']).order('change_date', desc=True).execute()
            
            next_billing_date = datetime.fromisoformat(subscription['next_billing_date']).date()
            days_until_billing = (next_billing_date - today).days
            
            # Calculate annual cost
            amount = float(subscription['amount'])
            billing_cycle = subscription['billing_cycle']
            
            if billing_cycle == 'weekly':
                annual_cost = amount * 52
            elif billing_cycle == 'monthly':
                annual_cost = amount * 12
            elif billing_cycle == 'quarterly':
                annual_cost = amount * 4
            else:  # yearly
                annual_cost = amount
            
            enriched_subscription = dict(subscription)
            enriched_subscription.update({
                'price_changes': price_changes_result.data,
                'days_until_billing': days_until_billing,
                'annual_cost': annual_cost,
                'is_due_soon': days_until_billing <= subscription.get('reminder_days', 3),
                'monthly_equivalent': annual_cost / 12
            })
            
            enriched_subscriptions.append(enriched_subscription)
        
        return success_response(enriched_subscriptions, "Subscriptions retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve subscriptions: {str(e)}", 500)

@subscriptions_bp.route('', methods=['POST'])
@require_auth
def create_subscription():
    """Create a new subscription"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        required_fields = ['name', 'amount', 'billing_cycle', 'next_billing_date', 'category']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)
        
        # Validate billing cycle
        valid_cycles = ['weekly', 'monthly', 'quarterly', 'yearly']
        if data['billing_cycle'] not in valid_cycles:
            return error_response(f"billing_cycle must be one of: {', '.join(valid_cycles)}", 400)
        
        # Validate date format
        try:
            next_billing_date = datetime.fromisoformat(data['next_billing_date']).date()
        except ValueError:
            return error_response("Invalid next_billing_date format. Use YYYY-MM-DD", 400)
        
        subscription_data = {
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'name': data['name'],
            'amount': float(data['amount']),
            'billing_cycle': data['billing_cycle'],
            'next_billing_date': next_billing_date.isoformat(),
            'category': data['category'],
            'is_active': data.get('is_active', True),
            'auto_renew': data.get('auto_renew', True),
            'reminder_days': data.get('reminder_days', 3),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase_client.table('subscriptions').insert(subscription_data).execute()
        
        if result.data:
            return success_response(result.data[0], "Subscription created successfully", 201)
        else:
            return error_response("Failed to create subscription", 500)
            
    except Exception as e:
        return error_response(f"Failed to create subscription: {str(e)}", 500)

@subscriptions_bp.route('/<subscription_id>/renew', methods=['POST'])
@require_auth
def renew_subscription(subscription_id):
    """Process subscription renewal (payment)"""
    try:
        user = get_current_user()
        data = request.get_json() or {}
        
        # Get subscription
        subscription_result = supabase_client.table('subscriptions').select('*').eq('id', subscription_id).eq('user_id', user['id']).execute()
        
        if not subscription_result.data:
            return error_response("Subscription not found", 404)
        
        subscription = subscription_result.data[0]
        
        if not subscription['is_active']:
            return error_response("Subscription is not active", 400)
        
        # Calculate next billing date
        current_date = datetime.fromisoformat(subscription['next_billing_date']).date()
        next_date = calculate_next_billing_date(current_date, subscription['billing_cycle'])
        
        # Update subscription
        update_data = {
            'next_billing_date': next_date.isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        supabase_client.table('subscriptions').update(update_data).eq('id', subscription_id).execute()
        
        # Create transaction record
        create_transaction = data.get('create_transaction', True)
        if create_transaction:
            transaction_data = {
                'id': str(uuid.uuid4()),
                'user_id': user['id'],
                'amount': float(subscription['amount']),
                'description': f"{subscription['name']} subscription",
                'category_name': subscription['category'],
                'transaction_type': 'expense',
                'source': 'subscription_renewal',
                'date': datetime.utcnow().isoformat(),
                'notes': f"{subscription['billing_cycle']} subscription renewal",
                'tags': ['subscription', 'recurring'],
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            supabase_client.table('transactions').insert(transaction_data).execute()
        
        return success_response({
            'subscription_id': subscription_id,
            'amount': float(subscription['amount']),
            'next_billing_date': next_date.isoformat(),
            'transaction_created': create_transaction
        }, "Subscription renewed successfully")
        
    except Exception as e:
        return error_response(f"Failed to renew subscription: {str(e)}", 500)

@subscriptions_bp.route('/<subscription_id>/cancel', methods=['POST'])
@require_auth
def cancel_subscription(subscription_id):
    """Cancel a subscription"""
    try:
        user = get_current_user()
        
        # Get subscription
        subscription_result = supabase_client.table('subscriptions').select('*').eq('id', subscription_id).eq('user_id', user['id']).execute()
        
        if not subscription_result.data:
            return error_response("Subscription not found", 404)
        
        # Mark as inactive
        update_data = {
            'is_active': False,
            'auto_renew': False,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase_client.table('subscriptions').update(update_data).eq('id', subscription_id).execute()
        
        if result.data:
            return success_response(result.data[0], "Subscription cancelled successfully")
        else:
            return error_response("Failed to cancel subscription", 500)
        
    except Exception as e:
        return error_response(f"Failed to cancel subscription: {str(e)}", 500)

@subscriptions_bp.route('/<subscription_id>/price', methods=['POST'])
@require_auth
def update_subscription_price(subscription_id):
    """Update subscription price and record price change"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        if 'new_amount' not in data:
            return error_response("new_amount is required", 400)
        
        new_amount = float(data['new_amount'])
        if new_amount <= 0:
            return error_response("new_amount must be positive", 400)
        
        # Get subscription
        subscription_result = supabase_client.table('subscriptions').select('*').eq('id', subscription_id).eq('user_id', user['id']).execute()
        
        if not subscription_result.data:
            return error_response("Subscription not found", 404)
        
        subscription = subscription_result.data[0]
        old_amount = float(subscription['amount'])
        
        if old_amount == new_amount:
            return error_response("New amount is the same as current amount", 400)
        
        # Record price change with user_id for proper data isolation
        price_change_data = {
            'id': str(uuid.uuid4()),
            'subscription_id': subscription_id,
            'user_id': user['id'],  # Add user_id for proper data isolation
            'old_amount': old_amount,
            'new_amount': new_amount,
            'change_date': date.today().isoformat(),
            'reason': data.get('reason'),
            'created_at': datetime.utcnow().isoformat()
        }
        
        supabase_client.table('price_changes').insert(price_change_data).execute()
        
        # Update subscription amount
        update_data = {
            'amount': new_amount,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase_client.table('subscriptions').update(update_data).eq('id', subscription_id).execute()
        
        if result.data:
            return success_response({
                'subscription_id': subscription_id,
                'old_amount': old_amount,
                'new_amount': new_amount,
                'change_amount': new_amount - old_amount,
                'change_percentage': ((new_amount - old_amount) / old_amount * 100) if old_amount > 0 else 0
            }, "Subscription price updated successfully")
        else:
            return error_response("Failed to update subscription price", 500)
        
    except Exception as e:
        return error_response(f"Failed to update subscription price: {str(e)}", 500)

@subscriptions_bp.route('/<subscription_id>', methods=['PUT'])
@require_auth
def update_subscription(subscription_id):
    """Update a specific subscription"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Check if subscription exists
        existing = supabase_client.table('subscriptions').select('*').eq('id', subscription_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Subscription not found", 404)
        
        # Prepare update data
        update_data = {}
        updatable_fields = ['name', 'billing_cycle', 'next_billing_date', 'category', 
                           'is_active', 'auto_renew', 'reminder_days']
        
        for field in updatable_fields:
            if field in data:
                if field == 'next_billing_date' and data[field]:
                    try:
                        date_value = datetime.fromisoformat(data[field]).date()
                        update_data[field] = date_value.isoformat()
                    except ValueError:
                        return error_response("Invalid next_billing_date format. Use YYYY-MM-DD", 400)
                else:
                    update_data[field] = data[field]
        
        if update_data:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            result = supabase_client.table('subscriptions').update(update_data).eq('id', subscription_id).execute()
            
            if result.data:
                return success_response(result.data[0], "Subscription updated successfully")
            else:
                return error_response("Failed to update subscription", 500)
        else:
            return error_response("No valid fields to update", 400)
            
    except Exception as e:
        return error_response(f"Failed to update subscription: {str(e)}", 500)

@subscriptions_bp.route('/<subscription_id>', methods=['DELETE'])
@require_auth
def delete_subscription(subscription_id):
    """Delete a specific subscription and its price history"""
    try:
        user = get_current_user()
        
        # Check if subscription exists
        existing = supabase_client.table('subscriptions').select('*').eq('id', subscription_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Subscription not found", 404)
        
        # Delete price changes first (foreign key constraint)
        supabase_client.table('price_changes').delete().eq('subscription_id', subscription_id).execute()
        
        # Delete subscription
        supabase_client.table('subscriptions').delete().eq('id', subscription_id).execute()
        
        return success_response(None, "Subscription deleted successfully")
        
    except Exception as e:
        return error_response(f"Failed to delete subscription: {str(e)}", 500)

@subscriptions_bp.route('/summary', methods=['GET'])
@require_auth
def get_subscriptions_summary():
    """Get subscriptions summary with total costs and upcoming renewals"""
    try:
        user = get_current_user()
        
        # Get active subscriptions
        subscriptions_result = supabase_client.table('subscriptions').select('*').eq('user_id', user['id']).eq('is_active', True).execute()
        
        total_monthly_cost = 0
        total_annual_cost = 0
        upcoming_renewals = []
        
        today = date.today()
        next_week = today + timedelta(days=7)
        
        for subscription in subscriptions_result.data:
            amount = float(subscription['amount'])
            billing_cycle = subscription['billing_cycle']
            
            # Calculate monthly and annual costs
            if billing_cycle == 'weekly':
                monthly_cost = amount * 4.33  # Average weeks per month
                annual_cost = amount * 52
            elif billing_cycle == 'monthly':
                monthly_cost = amount
                annual_cost = amount * 12
            elif billing_cycle == 'quarterly':
                monthly_cost = amount / 3
                annual_cost = amount * 4
            else:  # yearly
                monthly_cost = amount / 12
                annual_cost = amount
            
            total_monthly_cost += monthly_cost
            total_annual_cost += annual_cost
            
            # Check for upcoming renewals
            next_billing_date = datetime.fromisoformat(subscription['next_billing_date']).date()
            if next_billing_date <= next_week:
                days_until = (next_billing_date - today).days
                upcoming_renewals.append({
                    'id': subscription['id'],
                    'name': subscription['name'],
                    'amount': amount,
                    'next_billing_date': subscription['next_billing_date'],
                    'days_until': days_until,
                    'category': subscription['category']
                })
        
        # Sort upcoming renewals by date
        upcoming_renewals.sort(key=lambda x: x['next_billing_date'])
        
        summary = {
            'total_subscriptions': len(subscriptions_result.data),
            'total_monthly_cost': round(total_monthly_cost, 2),
            'total_annual_cost': round(total_annual_cost, 2),
            'upcoming_renewals_count': len(upcoming_renewals),
            'upcoming_renewals': upcoming_renewals,
            'average_subscription_cost': round(total_monthly_cost / len(subscriptions_result.data), 2) if subscriptions_result.data else 0
        }
        
        return success_response(summary, "Subscriptions summary retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve subscriptions summary: {str(e)}", 500)

def calculate_next_billing_date(current_date, billing_cycle):
    """Calculate the next billing date based on cycle"""
    if billing_cycle == 'weekly':
        return current_date + timedelta(weeks=1)
    elif billing_cycle == 'monthly':
        # Same day next month
        if current_date.month == 12:
            return current_date.replace(year=current_date.year + 1, month=1)
        else:
            try:
                return current_date.replace(month=current_date.month + 1)
            except ValueError:
                # Handle cases like Jan 31 -> Feb 28
                return current_date.replace(month=current_date.month + 1, day=28)
    elif billing_cycle == 'quarterly':
        # Same day in 3 months
        month = current_date.month + 3
        year = current_date.year
        if month > 12:
            month -= 12
            year += 1
        try:
            return current_date.replace(year=year, month=month)
        except ValueError:
            return current_date.replace(year=year, month=month, day=28)
    else:  # yearly
        # Same day next year
        try:
            return current_date.replace(year=current_date.year + 1)
        except ValueError:
            # Handle leap year edge case
            return current_date.replace(year=current_date.year + 1, day=28)