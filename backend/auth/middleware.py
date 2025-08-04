#!/usr/bin/env python3
"""
Authentication Middleware for Agent-Cofounder
"""

import functools
from typing import Optional, Callable, Any, Union
from datetime import datetime
from flask import Flask, request, jsonify, g, redirect, session
from werkzeug.wrappers import Response

from auth_service import auth_service
from session_store import session_store
from models import UserResponse

class AuthMiddleware:
    """Authentication middleware for Flask applications"""
    
    def __init__(self, app: Optional[Flask] = None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Initialize middleware with Flask app"""
        app.config.setdefault('AUTH_LOGIN_URL', '/auth/login')
        app.config.setdefault('AUTH_SIGNUP_URL', '/auth/signup')
        app.config.setdefault('AUTH_LOGOUT_URL', '/auth/logout')
        app.config.setdefault('AUTH_SUCCESS_URL', '/auth/login-success')
        
        # Register middleware
        app.before_request(self.before_request)
        app.teardown_appcontext(self.teardown)
    
    def before_request(self):
        """Run before each request to handle authentication"""
        g.current_user = None
        g.is_authenticated = False
        
        print(f"🔍 Middleware before_request - Path: {request.path} | Method: {request.method} | IP: {request.remote_addr}")
        
        # Skip auth for static files and auth endpoints
        if self._should_skip_auth():
            print(f"⏭️ Skipping auth middleware for: {request.path}")
            return
        
        print(f"🔄 Running auth middleware for: {request.path}")
        
        # Try to get user from session/token
        user = self._get_current_user()
        if user:
            g.current_user = user
            g.is_authenticated = True
            print(f"✅ User authenticated: {user.email}")
        else:
            print(f"❌ No user found for path: {request.path}")
    
    def teardown(self, exception):
        """Clean up after request"""
        pass
    
    def _should_skip_auth(self) -> bool:
        """Check if authentication should be skipped for this request"""
        skip_paths = [
            '/auth/login',
            '/auth/signup', 
            '/auth/reset-password',
            '/auth/google',
            '/auth/callback',
            '/auth/debug',
            '/auth/test',
            '/auth/health',
            '/auth/static/',  # Fix: Add auth prefix
            '/static/',
            '/favicon.ico'
        ]
        
        # Don't skip auth middleware for login-success and profile pages
        return any(request.path.startswith(path) for path in skip_paths)
    
    def _get_current_user(self) -> Optional[UserResponse]:
        """Get current user from production session store"""
        
        # Get session ID from Flask session
        session_id = session.get('session_id')
        
        print(f"🔍 Session check - Session ID: {session_id} | Flask Session Keys: {list(session.keys())}")
        
        if not session_id:
            print(f"❌ No session ID found in Flask session")
            return None
        
        # Get session data from production store
        session_data = session_store.get_session(session_id)
        
        if not session_data:
            print(f"❌ No session data found for session_id: {session_id}")
            # Clean up invalid session from Flask
            session.clear()
            return None
        
        print(f"✅ Valid session found for user: {session_data.get('user_email')}")
        
        # Create UserResponse from session data
        try:
            return UserResponse(
                id=session_data['user_id'],
                email=session_data['user_email'],
                full_name=session_data['user_name'] or 'User',
                company_name=session_data.get('company_name'),
                startup_stage=session_data.get('startup_stage'),
                avatar_url=session_data.get('avatar_url'),  # Include avatar URL from session
                created_at=datetime.fromisoformat(session_data['created_at']),
                last_sign_in_at=datetime.fromisoformat(session_data['last_accessed']),
                email_confirmed_at=datetime.utcnow()
            )
        except Exception as e:
            print(f"❌ Error creating user from session data: {e}")
            return None

# Decorators for route protection
def login_required(f: Callable) -> Callable:
    """Decorator to require authentication for a route"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if not g.get('is_authenticated', False):
            if request.is_json:
                return jsonify({
                    'success': False,
                    'message': 'Authentication required',
                    'error_code': 'AUTH_REQUIRED'
                }), 401
            else:
                from urllib.parse import quote
                return redirect(f'/auth/login?next={quote(request.url)}')
        return f(*args, **kwargs)
    return decorated_function

def anonymous_required(f: Callable) -> Callable:
    """Decorator to require NO authentication (for login/signup pages)"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if g.get('is_authenticated', False):
            if request.is_json:
                return jsonify({
                    'success': True,
                    'message': 'Already authenticated',
                    'redirect': '/auth/login-success'
                })
            else:
                return redirect('/auth/login-success')
        return f(*args, **kwargs)
    return decorated_function

def role_required(required_role: str):
    """Decorator to require specific role (future enhancement)"""
    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            user = g.current_user
            if not user or not hasattr(user, 'role') or user.role != required_role:
                if request.is_json:
                    return jsonify({
                        'success': False,
                        'message': f'Role {required_role} required',
                        'error_code': 'INSUFFICIENT_PERMISSIONS'
                    }), 403
                else:
                    return redirect('/unauthorized')
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Utility functions for templates and views
def get_current_user() -> Optional[UserResponse]:
    """Get current authenticated user"""
    return g.get('current_user')

def is_authenticated() -> bool:
    """Check if current request is authenticated"""
    return g.get('is_authenticated', False)

# Flask context processors
def inject_auth_context():
    """Inject authentication context into templates"""
    return {
        'current_user': get_current_user(),
        'is_authenticated': is_authenticated()
    }

# API Response helpers
def auth_response(success: bool, message: str, data: Any = None, status_code: int = 200) -> Response:
    """Create standardized authentication response"""
    response_data = {
        'success': success,
        'message': message
    }
    
    if data is not None:
        response_data['data'] = data
    
    return jsonify(response_data), status_code

def unauthorized_response(message: str = "Authentication required") -> Response:
    """Create unauthorized response"""
    return auth_response(False, message, status_code=401)

def forbidden_response(message: str = "Insufficient permissions") -> Response:
    """Create forbidden response"""
    return auth_response(False, message, status_code=403)

# Session helpers
def login_user_session(user: UserResponse, remember: bool = False, request_info: dict = None):
    """Log in user by creating production-grade session"""
    
    # Clear any existing session data first
    session.clear()
    
    # Prepare user data for session store
    user_data = {
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'company_name': user.company_name,
        'startup_stage': user.startup_stage,
        'avatar_url': user.avatar_url,  # Include avatar URL
        'login_method': request_info.get('login_method', 'email') if request_info else 'email',
        'ip_address': request_info.get('ip_address') if request_info else None,
        'user_agent': request_info.get('user_agent') if request_info else None
    }
    
    # Create session in production store
    session_data = session_store.create_session(user_data)
    
    # Store only session ID in Flask session (lightweight)
    session['session_id'] = session_data['session_id']
    session['user_id'] = session_data['user_id']  # For quick access
    session['is_authenticated'] = True
    
    # Make session permanent for persistence
    session.permanent = True
    session.modified = True
    
    # Set current user in request context
    g.current_user = user
    g.is_authenticated = True
    
    print(f"✅ Production session created for user: {user.email}")
    print(f"📊 User ID: {session_data['user_id']}")
    print(f"🔍 Session ID: {session_data['session_id']}")
    print(f"⏰ Expires: {session_data['expires_at']}")

def logout_user_session():
    """Log out user by clearing production session"""
    session_id = session.get('session_id')
    user_id = session.get('user_id')
    user_email = session.get('user_email')
    
    print(f"🚪 Logging out user: {user_id} ({user_email}) | Session: {session_id}")
    
    # Invalidate session in production store
    if session_id:
        session_store.invalidate_session(session_id)
    
    # Clear Flask session
    session.clear()
    
    # Clear request context
    g.current_user = None
    g.is_authenticated = False

# Rate limiting (basic implementation)
class RateLimiter:
    """Basic rate limiter for authentication endpoints"""
    
    def __init__(self):
        self.attempts = {}  # In production, use Redis or database
        self.max_attempts = 5
        self.window_minutes = 15
    
    def is_rate_limited(self, identifier: str) -> bool:
        """Check if identifier is rate limited"""
        import time
        from datetime import datetime, timedelta
        
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=self.window_minutes)
        
        # Clean old attempts
        if identifier in self.attempts:
            self.attempts[identifier] = [
                attempt for attempt in self.attempts[identifier]
                if attempt > window_start
            ]
        
        # Check if rate limited
        attempts_count = len(self.attempts.get(identifier, []))
        return attempts_count >= self.max_attempts
    
    def record_attempt(self, identifier: str):
        """Record a failed attempt"""
        from datetime import datetime
        
        if identifier not in self.attempts:
            self.attempts[identifier] = []
        
        self.attempts[identifier].append(datetime.utcnow())

# Global rate limiter instance
rate_limiter = RateLimiter()

def rate_limit_check(identifier_func: Callable = None):
    """Decorator for rate limiting"""
    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            # Get identifier (IP address by default)
            if identifier_func:
                identifier = identifier_func()
            else:
                identifier = request.remote_addr
            
            if rate_limiter.is_rate_limited(identifier):
                return auth_response(
                    False, 
                    "Too many attempts. Please try again later.",
                    status_code=429
                )
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator