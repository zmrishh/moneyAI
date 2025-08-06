from flask import Blueprint, request, jsonify
from api.utils.auth_helpers import require_auth, get_current_user
from api.utils.response_helpers import success_response, error_response, paginated_response
from config import supabase_client
from datetime import datetime, timedelta
import uuid

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('', methods=['GET'])
@require_auth
def get_transactions():
    """
    Get user's transactions with optional filtering and pagination
    Query parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 50, max: 100)
    - category: Filter by category name
    - type: Filter by transaction type (income/expense)
    - start_date: Filter transactions from this date (YYYY-MM-DD)
    - end_date: Filter transactions until this date (YYYY-MM-DD)
    - search: Search in description and merchant
    """
    try:
        user = get_current_user()
        
        # Pagination parameters
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)
        offset = (page - 1) * per_page
        
        # Build query
        query = supabase_client.table('transactions').select('*').eq('user_id', user['id'])
        
        # Apply filters
        if request.args.get('category'):
            query = query.eq('category_name', request.args.get('category'))
        
        if request.args.get('type'):
            query = query.eq('transaction_type', request.args.get('type'))
        
        if request.args.get('start_date'):
            start_date = datetime.fromisoformat(request.args.get('start_date')).isoformat()
            query = query.gte('date', start_date)
        
        if request.args.get('end_date'):
            end_date = datetime.fromisoformat(request.args.get('end_date')).isoformat()
            query = query.lte('date', end_date)
        
        if request.args.get('search'):
            search_term = request.args.get('search')
            query = query.or_(f"description.ilike.%{search_term}%,merchant.ilike.%{search_term}%")
        
        # Get total count for pagination
        count_response = query.execute()
        total = len(count_response.data) if count_response.data else 0
        
        # Get paginated results
        result = query.order('date', desc=True).range(offset, offset + per_page - 1).execute()
        
        return paginated_response(result.data, page, per_page, total, "Transactions retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve transactions: {str(e)}", 500)

@transactions_bp.route('', methods=['POST'])
@require_auth
def create_transaction():
    """
    Create a new transaction
    Required fields: amount, description, category_name, transaction_type, date
    Optional fields: location, merchant, notes, tags, receipt_url, source
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'description', 'category_name', 'transaction_type', 'date']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)
        
        # Validate transaction type
        if data['transaction_type'] not in ['income', 'expense']:
            return error_response("transaction_type must be 'income' or 'expense'", 400)
        
        # Prepare transaction data
        transaction_data = {
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'amount': float(data['amount']),
            'description': data['description'],
            'category_name': data['category_name'],
            'transaction_type': data['transaction_type'],
            'date': data['date'],
            'source': data.get('source', 'manual'),
            'location': data.get('location'),
            'merchant': data.get('merchant'),
            'notes': data.get('notes'),
            'tags': data.get('tags', []),
            'receipt_url': data.get('receipt_url'),
            'is_recurring': data.get('is_recurring', False),
            'recurring_id': data.get('recurring_id'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Insert transaction
        result = supabase_client.table('transactions').insert(transaction_data).execute()
        
        if result.data:
            return success_response(result.data[0], "Transaction created successfully", 201)
        else:
            return error_response("Failed to create transaction", 500)
            
    except Exception as e:
        return error_response(f"Failed to create transaction: {str(e)}", 500)

@transactions_bp.route('/<transaction_id>', methods=['GET'])
@require_auth
def get_transaction(transaction_id):
    """Get a specific transaction by ID"""
    try:
        user = get_current_user()
        
        result = supabase_client.table('transactions').select('*').eq('id', transaction_id).eq('user_id', user['id']).execute()
        
        if not result.data:
            return error_response("Transaction not found", 404)
        
        return success_response(result.data[0], "Transaction retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve transaction: {str(e)}", 500)

@transactions_bp.route('/<transaction_id>', methods=['PUT'])
@require_auth
def update_transaction(transaction_id):
    """Update a specific transaction"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Check if transaction exists and belongs to user
        existing = supabase_client.table('transactions').select('*').eq('id', transaction_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Transaction not found", 404)
        
        # Prepare update data
        update_data = {}
        updatable_fields = ['amount', 'description', 'category_name', 'transaction_type', 'date', 
                           'location', 'merchant', 'notes', 'tags', 'receipt_url', 'source']
        
        for field in updatable_fields:
            if field in data:
                update_data[field] = data[field]
        
        if update_data:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            result = supabase_client.table('transactions').update(update_data).eq('id', transaction_id).execute()
            
            if result.data:
                return success_response(result.data[0], "Transaction updated successfully")
            else:
                return error_response("Failed to update transaction", 500)
        else:
            return error_response("No valid fields to update", 400)
            
    except Exception as e:
        return error_response(f"Failed to update transaction: {str(e)}", 500)

@transactions_bp.route('/<transaction_id>', methods=['DELETE'])
@require_auth
def delete_transaction(transaction_id):
    """Delete a specific transaction"""
    try:
        user = get_current_user()
        
        # Check if transaction exists and belongs to user
        existing = supabase_client.table('transactions').select('*').eq('id', transaction_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Transaction not found", 404)
        
        # Delete transaction
        result = supabase_client.table('transactions').delete().eq('id', transaction_id).execute()
        
        return success_response(None, "Transaction deleted successfully")
        
    except Exception as e:
        return error_response(f"Failed to delete transaction: {str(e)}", 500)

@transactions_bp.route('/summary', methods=['GET'])
@require_auth
def get_transaction_summary():
    """
    Get transaction summary with income, expense, and balance
    Query parameters:
    - start_date: Start date for summary (YYYY-MM-DD)
    - end_date: End date for summary (YYYY-MM-DD)
    - period: Quick period filter (today, week, month, year)
    """
    try:
        user = get_current_user()
        
        # Date range handling
        end_date = datetime.now()
        start_date = None
        
        if request.args.get('period'):
            period = request.args.get('period')
            if period == 'today':
                start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif period == 'week':
                start_date = end_date - timedelta(days=7)
            elif period == 'month':
                start_date = end_date.replace(day=1)
            elif period == 'year':
                start_date = end_date.replace(month=1, day=1)
        
        if request.args.get('start_date'):
            start_date = datetime.fromisoformat(request.args.get('start_date'))
        
        if request.args.get('end_date'):
            end_date = datetime.fromisoformat(request.args.get('end_date'))
        
        # Build query
        query = supabase_client.table('transactions').select('amount,transaction_type').eq('user_id', user['id'])
        
        if start_date:
            query = query.gte('date', start_date.isoformat())
        
        if end_date:
            query = query.lte('date', end_date.isoformat())
        
        result = query.execute()
        
        # Calculate summary
        total_income = sum(float(t['amount']) for t in result.data if t['transaction_type'] == 'income')
        total_expense = sum(float(t['amount']) for t in result.data if t['transaction_type'] == 'expense')
        balance = total_income - total_expense
        
        summary = {
            'total_income': total_income,
            'total_expense': total_expense,
            'balance': balance,
            'transaction_count': len(result.data),
            'period': {
                'start_date': start_date.isoformat() if start_date else None,
                'end_date': end_date.isoformat() if end_date else None
            }
        }
        
        return success_response(summary, "Transaction summary retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve transaction summary: {str(e)}", 500)

@transactions_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all available transaction categories"""
    try:
        result = supabase_client.table('categories').select('*').order('name').execute()
        
        return success_response(result.data, "Categories retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve categories: {str(e)}", 500)

@transactions_bp.route('/bulk', methods=['POST'])
@require_auth
def create_bulk_transactions():
    """
    Create multiple transactions at once
    Request body should contain an array of transaction objects
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        if not isinstance(data, list):
            return error_response("Request body must be an array of transactions", 400)
        
        if len(data) > 100:
            return error_response("Maximum 100 transactions allowed per bulk operation", 400)
        
        transactions = []
        for i, transaction_data in enumerate(data):
            # Validate required fields
            required_fields = ['amount', 'description', 'category_name', 'transaction_type', 'date']
            for field in required_fields:
                if field not in transaction_data:
                    return error_response(f"Missing required field '{field}' in transaction {i + 1}", 400)
            
            # Prepare transaction data
            transaction = {
                'id': str(uuid.uuid4()),
                'user_id': user['id'],
                'amount': float(transaction_data['amount']),
                'description': transaction_data['description'],
                'category_name': transaction_data['category_name'],
                'transaction_type': transaction_data['transaction_type'],
                'date': transaction_data['date'],
                'source': transaction_data.get('source', 'import'),
                'location': transaction_data.get('location'),
                'merchant': transaction_data.get('merchant'),
                'notes': transaction_data.get('notes'),
                'tags': transaction_data.get('tags', []),
                'receipt_url': transaction_data.get('receipt_url'),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            transactions.append(transaction)
        
        # Insert all transactions
        result = supabase_client.table('transactions').insert(transactions).execute()
        
        if result.data:
            return success_response({
                'created_count': len(result.data),
                'transactions': result.data
            }, f"Successfully created {len(result.data)} transactions", 201)
        else:
            return error_response("Failed to create transactions", 500)
            
    except Exception as e:
        return error_response(f"Failed to create bulk transactions: {str(e)}", 500)