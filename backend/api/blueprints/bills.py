from flask import Blueprint, request
from api.utils.auth_helpers import require_auth, get_current_user
from api.utils.response_helpers import success_response, error_response
from config import supabase_client
from datetime import datetime, date, timedelta
import uuid

bills_bp = Blueprint('bills', __name__)

@bills_bp.route('', methods=['GET'])
@require_auth
def get_bills():
    """Get user's bills with optional filtering"""
    try:
        user = get_current_user()
        
        query = supabase_client.table('bills').select('*').eq('user_id', user['id'])
        
        # Apply filters
        if request.args.get('is_paid'):
            is_paid = request.args.get('is_paid').lower() == 'true'
            query = query.eq('is_paid', is_paid)
        
        if request.args.get('category'):
            query = query.eq('category', request.args.get('category'))
        
        if request.args.get('upcoming'):
            # Get bills due in next 30 days
            today = date.today()
            next_month = today + timedelta(days=30)
            query = query.gte('due_date', today.isoformat()).lte('due_date', next_month.isoformat())
        
        result = query.order('due_date').execute()
        
        # Enrich bills with status information
        enriched_bills = []
        today = date.today()
        
        for bill in result.data:
            due_date = datetime.fromisoformat(bill['due_date']).date()
            days_until_due = (due_date - today).days
            
            # Determine status
            if bill['is_paid']:
                status = 'paid'
            elif days_until_due < 0:
                status = 'overdue'
            elif days_until_due <= bill.get('reminder_days', 3):
                status = 'due_soon'  
            else:
                status = 'upcoming'
            
            enriched_bill = dict(bill)
            enriched_bill.update({
                'days_until_due': days_until_due,
                'status': status,
                'is_overdue': days_until_due < 0 and not bill['is_paid']
            })
            
            enriched_bills.append(enriched_bill)
        
        return success_response(enriched_bills, "Bills retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve bills: {str(e)}", 500)

@bills_bp.route('', methods=['POST'])
@require_auth
def create_bill():
    """Create a new bill"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        required_fields = ['name', 'amount', 'due_date', 'category']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)
        
        # Validate date format
        try:
            due_date = datetime.fromisoformat(data['due_date']).date()
        except ValueError:
            return error_response("Invalid due_date format. Use YYYY-MM-DD", 400)
        
        bill_data = {
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'name': data['name'],
            'amount': float(data['amount']),
            'due_date': due_date.isoformat(),
            'category': data['category'],
            'is_recurring': data.get('is_recurring', False),
            'recurrence_pattern': data.get('recurrence_pattern'),
            'auto_pay': data.get('auto_pay', False),
            'reminder_days': data.get('reminder_days', 3),
            'late_fee': data.get('late_fee'),
            'is_paid': False,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase_client.table('bills').insert(bill_data).execute()
        
        if result.data:
            return success_response(result.data[0], "Bill created successfully", 201)
        else:
            return error_response("Failed to create bill", 500)
            
    except Exception as e:
        return error_response(f"Failed to create bill: {str(e)}", 500)

@bills_bp.route('/<bill_id>/pay', methods=['POST'])
@require_auth
def pay_bill(bill_id):
    """Mark a bill as paid and optionally create transaction"""
    try:
        user = get_current_user()
        data = request.get_json() or {}
        
        # Get bill
        bill_result = supabase_client.table('bills').select('*').eq('id', bill_id).eq('user_id', user['id']).execute()
        
        if not bill_result.data:
            return error_response("Bill not found", 404)
        
        bill = bill_result.data[0]
        
        if bill['is_paid']:
            return error_response("Bill is already marked as paid", 400)
        
        # Mark bill as paid
        payment_date = datetime.utcnow().isoformat()
        actual_amount = data.get('actual_amount', bill['amount'])
        
        update_data = {
            'is_paid': True,
            'payment_date': payment_date,
            'updated_at': payment_date
        }
        
        supabase_client.table('bills').update(update_data).eq('id', bill_id).execute()
        
        # Create transaction record
        create_transaction = data.get('create_transaction', True)
        if create_transaction:
            transaction_data = {
                'id': str(uuid.uuid4()),
                'user_id': user['id'],
                'amount': float(actual_amount),
                'description': f"Bill payment: {bill['name']}",
                'category_name': bill['category'],
                'transaction_type': 'expense',
                'source': 'manual',
                'date': datetime.utcnow().isoformat(),
                'notes': data.get('notes'),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            supabase_client.table('transactions').insert(transaction_data).execute()
        
        # Generate next bill if recurring
        if bill['is_recurring'] and bill['recurrence_pattern']:
            next_due_date = calculate_next_due_date(
                datetime.fromisoformat(bill['due_date']).date(),
                bill['recurrence_pattern']
            )
            
            next_bill_data = dict(bill)
            next_bill_data.update({
                'id': str(uuid.uuid4()),
                'due_date': next_due_date.isoformat(),
                'is_paid': False,
                'payment_date': None,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            })
            
            supabase_client.table('bills').insert(next_bill_data).execute()
        
        return success_response({
            'bill_id': bill_id,
            'payment_date': payment_date,
            'actual_amount': actual_amount,
            'transaction_created': create_transaction
        }, "Bill marked as paid successfully")
        
    except Exception as e:
        return error_response(f"Failed to pay bill: {str(e)}", 500)

@bills_bp.route('/<bill_id>', methods=['PUT'])
@require_auth
def update_bill(bill_id):
    """Update a specific bill"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Check if bill exists
        existing = supabase_client.table('bills').select('*').eq('id', bill_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Bill not found", 404)
        
        # Prepare update data
        update_data = {}
        updatable_fields = ['name', 'amount', 'due_date', 'category', 'is_recurring', 
                           'recurrence_pattern', 'auto_pay', 'reminder_days', 'late_fee']
        
        for field in updatable_fields:
            if field in data:
                if field == 'due_date' and data[field]:
                    try:
                        date_value = datetime.fromisoformat(data[field]).date()
                        update_data[field] = date_value.isoformat()
                    except ValueError:
                        return error_response("Invalid due_date format. Use YYYY-MM-DD", 400)
                else:
                    update_data[field] = data[field]
        
        if update_data:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            result = supabase_client.table('bills').update(update_data).eq('id', bill_id).execute()
            
            if result.data:
                return success_response(result.data[0], "Bill updated successfully")
            else:
                return error_response("Failed to update bill", 500)
        else:
            return error_response("No valid fields to update", 400)
            
    except Exception as e:
        return error_response(f"Failed to update bill: {str(e)}", 500)

@bills_bp.route('/<bill_id>', methods=['DELETE'])
@require_auth
def delete_bill(bill_id):
    """Delete a specific bill"""
    try:
        user = get_current_user()
        
        # Check if bill exists
        existing = supabase_client.table('bills').select('*').eq('id', bill_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Bill not found", 404)
        
        # Delete bill
        supabase_client.table('bills').delete().eq('id', bill_id).execute()
        
        return success_response(None, "Bill deleted successfully")
        
    except Exception as e:
        return error_response(f"Failed to delete bill: {str(e)}", 500)

@bills_bp.route('/summary', methods=['GET'])
@require_auth
def get_bills_summary():
    """Get bills summary with upcoming, overdue, and total amounts"""
    try:
        user = get_current_user()
        
        # Get all unpaid bills
        bills_result = supabase_client.table('bills').select('*').eq('user_id', user['id']).eq('is_paid', False).execute()
        
        today = date.today()
        upcoming_bills = []
        overdue_bills = []
        due_soon_bills = []
        total_amount = 0
        
        for bill in bills_result.data:
            due_date = datetime.fromisoformat(bill['due_date']).date()
            days_until_due = (due_date - today).days
            amount = float(bill['amount'])
            total_amount += amount
            
            bill_summary = {
                'id': bill['id'],
                'name': bill['name'],
                'amount': amount,
                'due_date': bill['due_date'],
                'category': bill['category'],
                'days_until_due': days_until_due
            }
            
            if days_until_due < 0:
                overdue_bills.append(bill_summary)
            elif days_until_due <= bill.get('reminder_days', 3):
                due_soon_bills.append(bill_summary)
            else:
                upcoming_bills.append(bill_summary)
        
        # Sort by due date
        overdue_bills.sort(key=lambda x: x['due_date'])
        due_soon_bills.sort(key=lambda x: x['due_date'])
        upcoming_bills.sort(key=lambda x: x['due_date'])
        
        summary = {
            'total_bills': len(bills_result.data),
            'total_amount': total_amount,
            'overdue_count': len(overdue_bills),
            'due_soon_count': len(due_soon_bills), 
            'upcoming_count': len(upcoming_bills),
            'overdue_bills': overdue_bills,
            'due_soon_bills': due_soon_bills,
            'upcoming_bills': upcoming_bills[:5]  # Limit to 5 for summary
        }
        
        return success_response(summary, "Bills summary retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve bills summary: {str(e)}", 500)

def calculate_next_due_date(current_due_date, pattern):
    """Calculate the next due date based on recurrence pattern"""
    if pattern == 'monthly':
        # Same day next month
        if current_due_date.month == 12:
            return current_due_date.replace(year=current_due_date.year + 1, month=1)
        else:
            try:
                return current_due_date.replace(month=current_due_date.month + 1)
            except ValueError:
                # Handle cases like Jan 31 -> Feb 28
                return current_due_date.replace(month=current_due_date.month + 1, day=28)
    
    elif pattern == 'quarterly':
        # Same day in 3 months
        month = current_due_date.month + 3
        year = current_due_date.year
        if month > 12:
            month -= 12
            year += 1
        try:
            return current_due_date.replace(year=year, month=month)
        except ValueError:
            return current_due_date.replace(year=year, month=month, day=28)
    
    elif pattern == 'yearly':
        # Same day next year
        try:
            return current_due_date.replace(year=current_due_date.year + 1)
        except ValueError:
            # Handle leap year edge case
            return current_due_date.replace(year=current_due_date.year + 1, day=28)
    
    else:
        # Default to monthly
        return current_due_date.replace(month=current_due_date.month + 1)