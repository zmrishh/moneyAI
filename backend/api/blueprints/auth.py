from flask import Blueprint, request
from api.utils.response_helpers import success_response, error_response
from api.utils.auth_helpers import require_auth, get_current_user
from config import supabase_client
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        required_fields = ['email', 'password', 'full_name']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)
        
        # Sign up with Supabase Auth
        auth_response = supabase_client.auth.sign_up({
            "email": data['email'],
            "password": data['password'],
            "options": {
                "data": {
                    "full_name": data['full_name']
                }
            }
        })
        
        if auth_response.user:
            return success_response({
                'user_id': auth_response.user.id,
                'email': auth_response.user.email,
                'full_name': data['full_name'],
                'email_confirmed': auth_response.user.email_confirmed_at is not None
            }, "Account created successfully! Please check your email to verify your account.", 201)
        else:
            return error_response("Failed to create account", 400)
            
    except Exception as e:
        error_message = str(e)
        if "already registered" in error_message.lower():
            return error_response("An account with this email already exists", 400)
        return error_response(f"Registration failed: {error_message}", 400)

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        required_fields = ['email', 'password']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)
        
        # Sign in with Supabase Auth
        auth_response = supabase_client.auth.sign_in_with_password({
            "email": data['email'],
            "password": data['password']
        })
        
        if auth_response.user and auth_response.session:
            # Get user profile
            profile_result = supabase_client.table('users').select('*').eq('auth_id', auth_response.user.id).execute()
            
            user_profile = profile_result.data[0] if profile_result.data else None
            
            return success_response({
                'user': {
                    'id': user_profile['id'] if user_profile else auth_response.user.id,
                    'email': auth_response.user.email,
                    'full_name': user_profile['full_name'] if user_profile else auth_response.user.user_metadata.get('full_name', ''),
                    'avatar_url': user_profile['avatar_url'] if user_profile else None
                },
                'access_token': auth_response.session.access_token,
                'refresh_token': auth_response.session.refresh_token,
                'expires_at': auth_response.session.expires_at
            }, "Login successful")
        else:
            return error_response("Invalid email or password", 401)
            
    except Exception as e:
        error_message = str(e)
        if "invalid login credentials" in error_message.lower():
            return error_response("Invalid email or password", 401)
        elif "email not confirmed" in error_message.lower():
            return error_response("Please verify your email before logging in", 401)
        return error_response(f"Login failed: {error_message}", 400)

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """User logout endpoint"""
    try:
        # Sign out from Supabase
        supabase_client.auth.sign_out()
        
        return success_response(None, "Logged out successfully")
        
    except Exception as e:
        return error_response(f"Logout failed: {str(e)}", 400)

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token"""
    try:
        data = request.get_json()
        
        if 'refresh_token' not in data:
            return error_response("Refresh token is required", 400)
        
        # Refresh session with Supabase
        auth_response = supabase_client.auth.refresh_session(data['refresh_token'])
        
        if auth_response.session:
            return success_response({
                'access_token': auth_response.session.access_token,
                'refresh_token': auth_response.session.refresh_token,
                'expires_at': auth_response.session.expires_at
            }, "Token refreshed successfully")
        else:
            return error_response("Invalid refresh token", 401)
            
    except Exception as e:
        return error_response(f"Token refresh failed: {str(e)}", 401)

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Send password reset email"""
    try:
        data = request.get_json()
        
        if 'email' not in data:
            return error_response("Email is required", 400)
        
        # Send reset email via Supabase
        supabase_client.auth.reset_password_email(data['email'])
        
        return success_response(None, "Password reset email sent. Please check your inbox.")
        
    except Exception as e:
        return error_response(f"Failed to send reset email: {str(e)}", 400)

@auth_bp.route('/update-password', methods=['POST'])
def update_password():
    """Update user password"""
    try:
        data = request.get_json()
        
        required_fields = ['access_token', 'new_password']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)
        
        # Update password via Supabase
        user_response = supabase_client.auth.get_user(data['access_token'])
        
        if user_response.user:
            # Set session and update password
            supabase_client.auth.set_session(data['access_token'], "")
            auth_response = supabase_client.auth.update_user({"password": data['new_password']})
            
            if auth_response.user:
                return success_response(None, "Password updated successfully")
            else:
                return error_response("Failed to update password", 400)
        else:
            return error_response("Invalid access token", 401)
            
    except Exception as e:
        return error_response(f"Password update failed: {str(e)}", 400)

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return error_response("Authorization header is required", 401)
        
        access_token = auth_header.split(' ')[1]
        
        # Get user from Supabase
        user_response = supabase_client.auth.get_user(access_token)
        
        if user_response.user:
            # Get profile from database
            profile_result = supabase_client.table('users').select('*').eq('auth_id', user_response.user.id).execute()
            
            if profile_result.data:
                profile = profile_result.data[0]
                return success_response({
                    'id': profile['id'],
                    'email': profile['email'],
                    'full_name': profile['full_name'],
                    'avatar_url': profile['avatar_url'],
                    'phone': profile['phone'],
                    'country_code': profile['country_code'],
                    'currency': profile['currency'],
                    'timezone': profile['timezone'],
                    'created_at': profile['created_at'],
                    'last_login': profile['last_login']
                }, "Profile retrieved successfully")
            else:
                return error_response("Profile not found", 404)
        else:
            return error_response("Invalid access token", 401)
            
    except Exception as e:
        return error_response(f"Failed to retrieve profile: {str(e)}", 400)

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return error_response("Authorization header is required", 401)
        
        access_token = auth_header.split(' ')[1]
        data = request.get_json()
        
        # Get user from Supabase
        user_response = supabase_client.auth.get_user(access_token)
        
        if user_response.user:
            # Update profile in database
            update_data = {}
            updatable_fields = ['full_name', 'avatar_url', 'phone', 'country_code', 'currency', 'timezone']
            
            for field in updatable_fields:
                if field in data:
                    update_data[field] = data[field]
            
            if update_data:
                update_data['updated_at'] = datetime.utcnow().isoformat()
                
                result = supabase_client.table('users').update(update_data).eq('auth_id', user_response.user.id).execute()
                
                if result.data:
                    return success_response(result.data[0], "Profile updated successfully")
                else:
                    return error_response("Failed to update profile", 500)
            else:
                return error_response("No valid fields to update", 400)
        else:
            return error_response("Invalid access token", 401)
            
    except Exception as e:
        return error_response(f"Failed to update profile: {str(e)}", 400)

@auth_bp.route('/users', methods=['GET'])
@require_auth
def list_users():
    """List all users in the system (shows users that are accessible)"""
    try:
        current_user = get_current_user()
        
        # Since we can't access admin APIs with anon key, we'll show just the current user
        # and provide information about the user/auth connection
        users = [current_user]
        
        return success_response({
            'users': users,
            'total_count': len(users),
            'note': 'Currently showing accessible users. Full user list requires admin access.',
            'current_user_auth_connection': {
                'users_table_id': current_user['id'],
                'auth_id': current_user['auth_id'],
                'connection_working': True
            }
        }, "Users retrieved successfully")
        
    except Exception as e:
        return error_response(f"Failed to retrieve users: {str(e)}", 500)

@auth_bp.route('/sync-user-profile', methods=['POST'])
@require_auth 
def sync_user_profile():
    """Manually sync current user's profile to ensure auth-users table connection"""
    try:
        auth_header = request.headers.get('Authorization')
        access_token = auth_header.split(' ')[1]
        
        # Get user from Supabase Auth
        user_response = supabase_client.auth.get_user(access_token)
        
        if not user_response.user:
            return error_response("Invalid token", 401)
            
        auth_user = user_response.user
        
        # Check if profile exists
        profile_result = supabase_client.table('users').select('*').eq('auth_id', auth_user.id).execute()
        
        if profile_result.data:
            return success_response({
                'status': 'already_exists',
                'profile': profile_result.data[0]
            }, "User profile already exists and is connected")
        else:
            # Create missing profile
            new_profile = {
                'auth_id': auth_user.id,
                'email': auth_user.email,
                'full_name': auth_user.user_metadata.get('full_name', 'User'),
                'phone': auth_user.phone,
                'is_verified': auth_user.email_confirmed_at is not None,
                'is_active': True
            }
            
            insert_result = supabase_client.table('users').insert(new_profile).execute()
            
            if insert_result.data:
                return success_response({
                    'status': 'created',
                    'profile': insert_result.data[0]
                }, "User profile created and connected successfully")
            else:
                return error_response("Failed to create user profile", 500)
            
    except Exception as e:
        return error_response(f"Failed to sync user profile: {str(e)}", 500)