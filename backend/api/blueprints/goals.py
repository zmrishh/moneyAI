from flask import Blueprint, request
from api.utils.auth_helpers import require_auth, get_current_user
from api.utils.response_helpers import success_response, error_response
from config import supabase_client
from datetime import datetime, date
import uuid

goals_bp = Blueprint('goals', __name__)

@goals_bp.route('', methods=['GET'])
@require_auth
def get_goals():
    """Get user's goals with progress information"""
    try:
        user = get_current_user()
        
        # Get goals with milestones
        goals_result = supabase_client.table('goals').select('*').eq('user_id', user['id']).order('created_at', desc=True).execute()
        
        enriched_goals = []
        for goal in goals_result.data:
            # Get milestones for this goal
            milestones_result = supabase_client.table('milestones').select('*').eq('goal_id', goal['id']).order('percentage').execute()
            
            # Calculate progress
            current_amount = float(goal['current_amount'])
            target_amount = float(goal['target_amount'])
            progress_percentage = (current_amount / target_amount * 100) if target_amount > 0 else 0
            
            # Calculate days remaining
            days_remaining = None
            if goal['target_date']:
                target_date = datetime.fromisoformat(goal['target_date']).date()
                today = date.today()
                days_remaining = (target_date - today).days if target_date > today else 0
            
            enriched_goal = dict(goal)
            enriched_goal.update({
                'milestones': milestones_result.data,
                'progress_percentage': round(progress_percentage, 2),
                'remaining_amount': target_amount - current_amount,
                'days_remaining': days_remaining,
                'is_completed': goal['is_completed'] or current_amount >= target_amount
            })
            
            enriched_goals.append(enriched_goal)
        
        return success_response(enriched_goals, "Goals retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve goals: {str(e)}", 500)

@goals_bp.route('', methods=['POST'])
@require_auth
def create_goal():
    """Create a new savings goal"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        required_fields = ['title', 'target_amount']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)
        
        goal_id = str(uuid.uuid4())
        goal_data = {
            'id': goal_id,
            'user_id': user['id'],
            'title': data['title'],
            'description': data.get('description'),
            'target_amount': float(data['target_amount']),
            'current_amount': float(data.get('current_amount', 0)),
            'target_date': data.get('target_date'),
            'goal_type': data.get('goal_type', 'savings'),
            'priority': data.get('priority', 'medium'),
            'category': data.get('category'),
            'auto_save_amount': data.get('auto_save_amount'),
            'auto_save_frequency': data.get('auto_save_frequency'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase_client.table('goals').insert(goal_data).execute()
        
        # Create default milestones if not provided
        milestones_data = data.get('milestones', [
            {'percentage': 25, 'amount': float(data['target_amount']) * 0.25},
            {'percentage': 50, 'amount': float(data['target_amount']) * 0.50},
            {'percentage': 75, 'amount': float(data['target_amount']) * 0.75},
            {'percentage': 100, 'amount': float(data['target_amount'])}
        ])
        
        milestones = []
        for milestone in milestones_data:
            milestone_data = {
                'id': str(uuid.uuid4()),
                'goal_id': goal_id,
                'percentage': milestone['percentage'],
                'amount': milestone['amount'],
                'achieved': False,
                'created_at': datetime.utcnow().isoformat()
            }
            milestones.append(milestone_data)
        
        if milestones:
            supabase_client.table('milestones').insert(milestones).execute()
        
        if result.data:
            # Return enriched goal data
            goal = result.data[0]
            goal['milestones'] = milestones
            goal['progress_percentage'] = (goal['current_amount'] / goal['target_amount'] * 100) if goal['target_amount'] > 0 else 0
            goal['remaining_amount'] = goal['target_amount'] - goal['current_amount']
            
            return success_response(goal, "Goal created successfully", 201)
        else:
            return error_response("Failed to create goal", 500)
            
    except Exception as e:
        return error_response(f"Failed to create goal: {str(e)}", 500)

@goals_bp.route('/<goal_id>/contribute', methods=['POST'])
@require_auth
def contribute_to_goal(goal_id):
    """Add money to a savings goal"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        if 'amount' not in data:
            return error_response("Amount is required", 400)
        
        contribution_amount = float(data['amount'])
        if contribution_amount <= 0:
            return error_response("Amount must be positive", 400)
        
        # Get goal
        goal_result = supabase_client.table('goals').select('*').eq('id', goal_id).eq('user_id', user['id']).execute()
        
        if not goal_result.data:
            return error_response("Goal not found", 404)
        
        goal = goal_result.data[0]
        new_amount = float(goal['current_amount']) + contribution_amount
        target_amount = float(goal['target_amount'])
        
        # Update goal
        update_data = {
            'current_amount': new_amount,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Mark as completed if target reached
        if new_amount >= target_amount and not goal['is_completed']:
            update_data['is_completed'] = True
            update_data['completed_at'] = datetime.utcnow().isoformat()
        
        supabase_client.table('goals').update(update_data).eq('id', goal_id).execute()
        
        # Update milestones
        milestones_result = supabase_client.table('milestones').select('*').eq('goal_id', goal_id).eq('achieved', False).execute()
        
        for milestone in milestones_result.data:
            if new_amount >= float(milestone['amount']):
                supabase_client.table('milestones').update({
                    'achieved': True,
                    'achieved_date': datetime.utcnow().isoformat()
                }).eq('id', milestone['id']).execute()
        
        # Create transaction record
        transaction_data = {
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'amount': contribution_amount,
            'description': f"Savings contribution: {goal['title']}",
            'category_name': 'Savings',
            'transaction_type': 'expense',
            'source': 'manual',
            'date': datetime.utcnow().isoformat(),
            'notes': data.get('note'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        supabase_client.table('transactions').insert(transaction_data).execute()
        
        progress_percentage = (new_amount / target_amount * 100) if target_amount > 0 else 0
        
        return success_response({
            'goal_id': goal_id,
            'contribution_amount': contribution_amount,
            'new_total': new_amount,
            'progress_percentage': round(progress_percentage, 2),
            'remaining_amount': max(0, target_amount - new_amount),
            'is_completed': new_amount >= target_amount
        }, "Contribution added successfully")
        
    except Exception as e:
        return error_response(f"Failed to add contribution: {str(e)}", 500)

@goals_bp.route('/<goal_id>', methods=['PUT'])
@require_auth  
def update_goal(goal_id):
    """Update a specific goal"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Check if goal exists
        existing = supabase_client.table('goals').select('*').eq('id', goal_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Goal not found", 404)
        
        # Prepare update data
        update_data = {}
        updatable_fields = ['title', 'description', 'target_amount', 'target_date', 
                           'goal_type', 'priority', 'category', 'auto_save_amount', 'auto_save_frequency']
        
        for field in updatable_fields:
            if field in data:
                update_data[field] = data[field]
        
        if update_data:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            result = supabase_client.table('goals').update(update_data).eq('id', goal_id).execute()
            
            if result.data:
                return success_response(result.data[0], "Goal updated successfully")
            else:  
                return error_response("Failed to update goal", 500)
        else:
            return error_response("No valid fields to update", 400)
            
    except Exception as e:
        return error_response(f"Failed to update goal: {str(e)}", 500)

@goals_bp.route('/<goal_id>', methods=['DELETE'])
@require_auth
def delete_goal(goal_id):
    """Delete a specific goal and its milestones"""
    try:
        user = get_current_user()
        
        # Check if goal exists
        existing = supabase_client.table('goals').select('*').eq('id', goal_id).eq('user_id', user['id']).execute()
        
        if not existing.data:
            return error_response("Goal not found", 404)
        
        # Delete milestones first (foreign key constraint)
        supabase_client.table('milestones').delete().eq('goal_id', goal_id).execute()
        
        # Delete goal
        supabase_client.table('goals').delete().eq('id', goal_id).execute()
        
        return success_response(None, "Goal deleted successfully")
        
    except Exception as e:
        return error_response(f"Failed to delete goal: {str(e)}", 500)