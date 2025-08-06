from flask import Blueprint, request
from api.utils.auth_helpers import require_auth, get_current_user
from api.utils.response_helpers import success_response, error_response
from config import supabase_client
from datetime import datetime, date
import uuid

debts_bp = Blueprint('debts', __name__)

@debts_bp.route('', methods=['GET'])
@require_auth
def get_debts():
    """Get user's debts with payment history"""
    try:
        user = get_current_user()
        
        # Get debts
        debts_result = supabase_client.table('debts').select('*').eq('user_id', user['id']).order('created_at', desc=True).execute()
        
        enriched_debts = []
        for debt in debts_result.data:
            # Get payments for this debt
            payments_result = supabase_client.table('debt_payments').select('*').eq('debt_id', debt['id']).order('date', desc=True).execute()
            
            # Calculate totals
            total_paid = sum(float(p['amount']) for p in payments_result.data)
            remaining_amount = float(debt['amount'])
            original_amount = float(debt['original_amount'])
            
            # Calculate days overdue if applicable
            days_overdue = None
            if debt['due_date'] and not debt['is_settled']:
                due_date = datetime.fromisoformat(debt['due_date']).date()
                today = date.today()
                if today > due_date:
                    days_overdue = (today - due_date).days
            
            enriched_debt = dict(debt)
            enriched_debt.update({
                'payments': payments_result.data,
                'total_paid': total_paid,
                'remaining_amount': remaining_amount,
                'payment_progress': (total_paid / original_amount * 100) if original_amount > 0 else 0,
                'days_overdue': days_overdue,
                'is_overdue': days_overdue is not None and days_overdue > 0
            })
            
            enriched_debts.append(enriched_debt)
        
        return success_response(enriched_debts, "Debts retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve debts: {str(e)}", 500)

@debts_bp.route('', methods=['POST'])
@require_auth
def create_debt():
    """Create a new debt record"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        required_fields = ['debt_type', 'person_name', 'amount', 'description', 'created_date']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)
        
        # Validate debt type
        if data['debt_type'] not in ['owe', 'owed']:
            return error_response("debt_type must be 'owe' or 'owed'", 400)
        
        # Validate dates
        try:
            created_date = datetime.fromisoformat(data['created_date']).date()
            due_date = None
            if data.get('due_date'):
                due_date = datetime.fromisoformat(data['due_date']).date()
        except ValueError:
            return error_response("Invalid date format. Use YYYY-MM-DD", 400)
        
        amount = float(data['amount'])
        
        debt_data = {
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'debt_type': data['debt_type'],
            'person_name': data['person_name'],
            'person_contact': data.get('person_contact'),
            'amount': amount,
            'original_amount': amount,  # Amount is remaining, original_amount is the initial amount
            'description': data['description'],
            'due_date': due_date.isoformat() if due_date else None,
            'created_date': created_date.isoformat(),
            'is_settled': False,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase_client.table('debts').insert(debt_data).execute()
        
        if result.data:
            return success_response(result.data[0], "Debt created successfully", 201)
        else:
            return error_response("Failed to create debt", 500)
            
    except Exception as e:
        return error_response(f"Failed to create debt: {str(e)}", 500)

@debts_bp.route('/<debt_id>/payments', methods=['POST'])
@require_auth
def add_payment(debt_id):
    """Add a payment to a debt"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        if 'amount' not in data:
            return error_response("Amount is required", 400)
        
        payment_amount = float(data['amount'])
        if payment_amount <= 0:
            return error_response("Payment amount must be positive", 400)
        
        # Get debt
        debt_result = supabase_client.table('debts').select('*').eq('id', debt_id).eq('user_id', user['id']).execute()
        
        if not debt_result.data:
            return error_response("Debt not found", 404)
        
        debt = debt_result.data[0]
        
        if debt['is_settled']:
            return error_response("Debt is already settled", 400)
        
        current_amount = float(debt['amount'])
        if payment_amount > current_amount:
            return error_response(f"Payment amount cannot exceed remaining debt amount of ₹{current_amount}", 400)
        
        # Create payment record
        payment_data = {
            'id': str(uuid.uuid4()),
            'debt_id': debt_id,
            'amount': payment_amount,
            'date': data.get('date', datetime.utcnow().isoformat()),
            'note': data.get('note'),
            'created_at': datetime.utcnow().isoformat()
        }
        
        supabase_client.table('debt_payments').insert(payment_data).execute()
        
        # Update debt amount
        new_amount = current_amount - payment_amount
        update_data = {
            'amount': new_amount,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Mark as settled if fully paid
        if new_amount <= 0:
            update_data['is_settled'] = True
            update_data['settled_date'] = datetime.utcnow().isoformat()
            update_data['amount'] = 0
        
        supabase_client.table('debts').update(update_data).eq('id', debt_id).execute()
        
        # Create transaction record
        create_transaction = data.get('create_transaction', True)
        if create_transaction:
            transaction_type = 'expense' if debt['debt_type'] == 'owe' else 'income'
            transaction_description = f"Debt payment to {debt['person_name']}" if debt['debt_type'] == 'owe' else f"Debt collection from {debt['person_name']}"
            
            transaction_data = {
                'id': str(uuid.uuid4()),
                'user_id': user['id'],
                'amount': payment_amount,
                'description': transaction_description,
                'category_name': 'Debt Payment',
                'transaction_type': transaction_type,
                'source': 'manual',
                'date': payment_data['date'],
                'notes': f"Payment for: {debt['description']}",
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            supabase_client.table('transactions').insert(transaction_data).execute()
        
        return success_response({
            'payment_id': payment_data['id'],
            'payment_amount': payment_amount,
            'remaining_amount': new_amount,
            'is_settled': new_amount <= 0,
            'transaction_created': create_transaction
        }, "Payment added successfully")
        
    except Exception as e:
        return error_response(f"Failed to add payment: {str(e)}", 500)

@debts_bp.route('/<debt_id>/settle', methods=['POST'])
@require_auth
def settle_debt(debt_id):
    """Mark a debt as fully settled"""
    try:
        user = get_current_user()
        data = request.get_json() or {}
        
        # Get debt
        debt_result = supabase_client.table('debts').select('*').eq('id', debt_id).eq('user_id', user['id']).execute()
        
        if not debt_result.data:
            return error_response("Debt not found", 404)
        
        debt = debt_result.data[0]
        
        if debt['is_settled']:
            return error_response("Debt is already settled", 400)
        
        # If there's remaining amount, add final payment
        remaining_amount = float(debt['amount'])
        if remaining_amount > 0:
            final_payment_data = {
                'id': str(uuid.uuid4()),
                'debt_id': debt_id,
                'amount': remaining_amount,
                'date': datetime.utcnow().isoformat(),
                'note': data.get('note', 'Final settlement'),
                'created_at': datetime.utcnow().isoformat()
            }
            
            supabase_client.table('debt_payments').insert(final_payment_data).execute()
        
        # Mark as settled
        update_data = {
            'is_settled': True,
            'settled_date': datetime.utcnow().isoformat(),
            'amount': 0,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        supabase_client.table('debts').update(update_data).eq('id', debt_id).execute()
        
        return success_response({
            'debt_id': debt_id,
            'final_payment_amount': remaining_amount,
            'settled_date': update_data['settled_date']
        }, "Debt settled successfully")
        
    except Exception as e:
        return error_response(f"Failed to settle debt: {str(e)}", 500)

@debts_bp.route('/<debt_id>', methods=['PUT'])
@require_auth
def update_debt(debt_id):
    """Update a specific debt"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Check if debt exists
        existing = supabase_client.table('debts').select('*').eq('id', debt_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Debt not found", 404)
        
        # Prepare update data
        update_data = {}
        updatable_fields = ['person_name', 'person_contact', 'description', 'due_date']
        
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
            
            result = supabase_client.table('debts').update(update_data).eq('id', debt_id).execute()
            
            if result.data:
                return success_response(result.data[0], "Debt updated successfully")
            else:
                return error_response("Failed to update debt", 500)
        else:
            return error_response("No valid fields to update", 400)
            
    except Exception as e:
        return error_response(f"Failed to update debt: {str(e)}", 500)

@debts_bp.route('/<debt_id>', methods=['DELETE'])
@require_auth
def delete_debt(debt_id):
    """Delete a specific debt and its payments"""
    try:
        user = get_current_user()
        
        # Check if debt exists
        existing = supabase_client.table('debts').select('*').eq('id', debt_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Debt not found", 404)
        
        # Delete payments first (foreign key constraint)
        supabase_client.table('debt_payments').delete().eq('debt_id', debt_id).execute()
        
        # Delete debt
        supabase_client.table('debts').delete().eq('id', debt_id).execute()
        
        return success_response(None, "Debt deleted successfully")
        
    except Exception as e:
        return error_response(f"Failed to delete debt: {str(e)}", 500)

@debts_bp.route('/summary', methods=['GET'])
@require_auth
def get_debts_summary():
    """Get debts summary with totals for owed and owing amounts"""
    try:
        user = get_current_user()
        
        # Get all active debts
        debts_result = supabase_client.table('debts').select('*').eq('user_id', user['id']).eq('is_settled', False).execute()
        
        total_owe = 0  # Money I owe to others
        total_owed = 0  # Money others owe to me
        overdue_owe = 0
        overdue_owed = 0
        owe_count = 0
        owed_count = 0
        
        today = date.today()
        
        for debt in debts_result.data:
            amount = float(debt['amount'])
            
            if debt['debt_type'] == 'owe':
                total_owe += amount
                owe_count += 1
                
                # Check if overdue
                if debt['due_date']:
                    due_date = datetime.fromisoformat(debt['due_date']).date()
                    if today > due_date:
                        overdue_owe += amount
            else:  # debt_type == 'owed'
                total_owed += amount
                owed_count += 1
                
                # Check if overdue
                if debt['due_date']:
                    due_date = datetime.fromisoformat(debt['due_date']).date()
                    if today > due_date:
                        overdue_owed += amount
        
        net_position = total_owed - total_owe  # Positive means more is owed to me
        
        summary = {
            'total_owe': total_owe,  # Money I need to pay
            'total_owed': total_owed,  # Money I should receive
            'net_position': net_position,
            'overdue_owe': overdue_owe,
            'overdue_owed': overdue_owed,
            'owe_count': owe_count,
            'owed_count': owed_count,
            'total_debts': len(debts_result.data)
        }
        
        return success_response(summary, "Debts summary retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve debts summary: {str(e)}", 500)