from functools import wraps
from flask import request, jsonify, g
from config import supabase_client
import jwt
import os
from datetime import datetime, timedelta

def require_auth(f):
    """Decorator to require authentication for API endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header is required'}), 401
        
        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(' ')[1] if auth_header.startswith('Bearer ') else auth_header
            
            # Verify token with Supabase
            user_response = supabase_client.auth.get_user(token)
            
            if not user_response.user:
                return jsonify({'error': 'Invalid or expired token'}), 401
            
            # Get user profile from our database
            profile_response = supabase_client.table('users').select('*').eq('auth_id', user_response.user.id).execute()
            
            if not profile_response.data:
                return jsonify({'error': 'User profile not found'}), 404
            
            # Store user info in Flask's g object for use in the request
            g.current_user = profile_response.data[0]
            g.auth_user = user_response.user
            
        except Exception as e:
            error_message = str(e).lower()
            if 'expired' in error_message or 'invalid' in error_message:
                return jsonify({
                    'error': 'Token expired', 
                    'code': 'TOKEN_EXPIRED',
                    'message': 'Your session has expired. Please refresh your token or log in again.',
                    'details': str(e)
                }), 401
            return jsonify({'error': 'Authentication failed', 'details': str(e)}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

def get_current_user():
    """Get the current authenticated user"""
    return getattr(g, 'current_user', None)

def get_auth_user():
    """Get the current authenticated Supabase user"""
    return getattr(g, 'auth_user', None)