import asyncio
import sys
import os
import functools
from datetime import datetime
from flask import Flask, request, jsonify, render_template, redirect, session, flash, g
from werkzeug.security import generate_password_hash, check_password_hash

# Add the parent directory to the path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auth_service import auth_service
from models import (
    UserSignupRequest, UserLoginRequest, PasswordResetRequest, 
    UserProfileUpdate
)
from middleware import (
    AuthMiddleware, login_required, anonymous_required, 
    login_user_session, logout_user_session, rate_limit_check
)
from session_store import cleanup_sessions

def async_route(f):
    """Decorator to run async functions in Flask routes"""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(f(*args, **kwargs))
        finally:
            loop.close()
    return wrapper

def create_auth_app(app: Flask = None) -> Flask:
    """Create Flask app with authentication system"""
    
    if app is None:
        app = Flask(__name__, 
                   template_folder='templates',
                   static_folder='static',
                   static_url_path='/auth/static')
    
    # Configuration - Generate secure secret key
    import secrets
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or secrets.token_urlsafe(64)
    app.config['PERMANENT_SESSION_LIFETIME'] = 86400 * 7  # 7 days for better UX
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for now
    
    # Session security - adjust for development vs production
    is_production = os.environ.get('ENVIRONMENT', 'development') == 'production'
    app.config['SESSION_COOKIE_SECURE'] = is_production  # HTTPS only in production
    app.config['SESSION_COOKIE_HTTPONLY'] = True  # No JS access
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # CSRF protection
    app.config['SESSION_COOKIE_NAME'] = 'auth_session'  # Custom session name
    app.config['SESSION_COOKIE_PATH'] = '/'  # Available for entire app
    app.config['JSON_SORT_KEYS'] = False
    
    print(f"🔧 Flask app configured with session lifetime: {app.config['PERMANENT_SESSION_LIFETIME']} seconds")
    print(f"🔧 Session cookie secure: {app.config['SESSION_COOKIE_SECURE']}")
    print(f"🔧 Secret key length: {len(app.config['SECRET_KEY'])} characters")
    
    # Security headers with CORS for mobile apps
    @app.after_request
    def add_security_headers(response):
        # CORS headers for mobile apps - Allow all origins in development
        if not is_production:
            response.headers['Access-Control-Allow-Origin'] = '*'
        else:
            # In production, be more restrictive
            origin = request.headers.get('Origin')
            allowed_origins = ['exp://', 'http://localhost', 'https://localhost']
            if origin and any(origin.startswith(allowed) for allowed in allowed_origins):
                response.headers['Access-Control-Allow-Origin'] = origin
        
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response.headers['Access-Control-Max-Age'] = '3600'
        
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Only add HSTS in production
        if is_production:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response
    
    # Initialize authentication middleware
    auth_middleware = AuthMiddleware(app)
    app.context_processor(lambda: {
        'current_user': getattr(g, 'current_user', None),
        'is_authenticated': getattr(g, 'is_authenticated', False)
    })
    
    # Add OPTIONS method support for CORS preflight
    @app.route('/auth/<path:path>', methods=['OPTIONS'])
    def handle_preflight(path):
        """Handle CORS preflight requests"""
        return '', 200
    
    # Routes
    @app.route('/auth/signup', methods=['GET', 'POST', 'OPTIONS'])
    @anonymous_required
    @rate_limit_check()
    @async_route
    async def signup():
        """User signup page and handler"""
        if request.method == 'GET':
            return render_template('signup.html')
        
        try:
            # Get form data
            data = request.get_json() or request.form.to_dict()
            
            # Validate and create signup request
            signup_request = UserSignupRequest(**data)
            
            # Process signup
            response = await auth_service.signup(signup_request)
            
            if response.success and response.access_token:
                # Auto-login after successful signup for both JSON and form requests
                request_info = {
                    'login_method': 'signup',
                    'ip_address': request.remote_addr,
                    'user_agent': request.user_agent.string
                }
                login_user_session(response.user, remember=False, request_info=request_info)
            
            if request.is_json:
                return jsonify(response.model_dump())
            
            if response.success:
                flash(response.message, 'success')
                if response.access_token:
                    # Store signup success data
                    session['login_success'] = {
                        'user_name': response.user.full_name or 'User',
                        'user_email': response.user.email,
                        'login_method': 'email'
                    }
                    return redirect('/auth/login-success')
                else:
                    return redirect('/auth/login')
            else:
                flash(response.message, 'error')
                return render_template('signup.html')
                
        except ValueError as e:
            error_msg = f"Validation error: {str(e)}"
            if request.is_json:
                return jsonify({'success': False, 'message': error_msg}), 400
            flash(error_msg, 'error')
            return render_template('signup.html')
        except Exception as e:
            import traceback
            import logging
            
            # Log the error for debugging (server-side only)
            error_details = str(e)
            traceback_str = traceback.format_exc()
            
            # Try to log to a file if possible
            try:
                logging.basicConfig(level=logging.ERROR)
                logging.error(f"Signup error: {error_details}\n{traceback_str}")
            except:
                pass  # If logging fails, continue anyway
            
            # Generic error message for security (don't expose internal details)
            generic_msg = "An error occurred during signup. Please try again."
            if request.is_json:
                return jsonify({'success': False, 'message': generic_msg}), 500
            flash(generic_msg, 'error')
            return render_template('signup.html')
    
    @app.route('/auth/login', methods=['GET', 'POST', 'OPTIONS'])
    @anonymous_required
    @rate_limit_check()
    @async_route
    async def login():
        """User login page and handler"""
        if request.method == 'GET':
            # Check if this is a password reset confirmation
            if request.args.get('type') == 'recovery':
                flash('Password reset successful! You can now login with your new password.', 'success')
            elif request.args.get('message'):
                flash('Password reset successful! Please login with your new password.', 'success')
            
            return render_template('login.html')
        
        try:
            # Get form data
            data = request.get_json() or request.form.to_dict()
            
            # Validate and create login request
            login_request = UserLoginRequest(**data)
            
            # Process login
            response = await auth_service.login(login_request)
            
            if response.success:
                # Create session with request info for both JSON and form requests
                remember = data.get('remember', False)
                request_info = {
                    'login_method': 'email',
                    'ip_address': request.remote_addr,
                    'user_agent': request.user_agent.string
                }
                login_user_session(response.user, remember=remember, request_info=request_info)
            
            if request.is_json:
                return jsonify(response.model_dump())
            
            if response.success:
                
                # Store login success data in session for success page
                session['login_success'] = {
                    'user_name': response.user.full_name or 'User',
                    'user_email': response.user.email,
                    'login_method': 'email'
                }
                
                # Always redirect to login success for confirmation
                return redirect('/auth/login-success')
            else:
                # Record failed attempt for rate limiting
                from middleware import rate_limiter
                rate_limiter.record_attempt(request.remote_addr)
                
                flash(response.message, 'error')
                return render_template('login.html')
                
        except ValueError as e:
            error_msg = f"Invalid input: {str(e)}"
            if request.is_json:
                return jsonify({'success': False, 'message': error_msg}), 400
            flash(error_msg, 'error')
            return render_template('login.html')
        except Exception as e:
            import logging
            logging.error(f"Login error: {str(e)}")
            
            # Generic error message for security
            generic_msg = "Login failed. Please check your credentials and try again."
            if request.is_json:
                return jsonify({'success': False, 'message': generic_msg}), 500
            flash(generic_msg, 'error')
            return render_template('login.html')
    
    @app.route('/auth/logout', methods=['GET', 'POST', 'OPTIONS'])
    @async_route
    async def logout():
        """User logout handler"""
        try:
            # Get access token if available
            access_token = None
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                access_token = auth_header.split(' ')[1]
            
            # Process logout
            response = await auth_service.logout(access_token)
            
            # Clear session
            logout_user_session()
            
            if request.is_json:
                return jsonify(response.model_dump())
            
            flash(response.message, 'success')
            return redirect('/auth/login')
            
        except Exception as e:
            error_msg = f"Logout error: {str(e)}"
            if request.is_json:
                return jsonify({'success': False, 'message': error_msg}), 500
            flash(error_msg, 'error')
            return redirect('/')
    
    @app.route('/auth/google', methods=['GET'])
    @anonymous_required
    @async_route
    async def google_login():
        """Initiate Google OAuth login"""
        try:
            # Generate Google OAuth URL - use the host from the current request
            callback_url = f"http://{request.host}/auth/callback"
            oauth_url = await auth_service.google_login(callback_url)
            return redirect(oauth_url)
        except Exception as e:
            print(f"Google OAuth error: {e}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            flash(f"Google login failed: {str(e)}", 'error')
            return redirect('/auth/login')
    
    @app.route('/auth/callback', methods=['GET'])
    @async_route
    async def oauth_callback():
        """Handle OAuth callback from Supabase"""
        try:
            # Supabase OAuth flow - check for different types of callback parameters
            access_token = request.args.get('access_token')
            refresh_token = request.args.get('refresh_token')
            code = request.args.get('code')
            error = request.args.get('error')
            error_description = request.args.get('error_description')
            
            print(f"OAuth callback received - access_token: {bool(access_token)}, code: {bool(code)}, error: {error}")
            
            # Check for errors first
            if error:
                error_msg = error_description or f"OAuth error: {error}"
                print(f"OAuth error: {error_msg}")
                flash(f"Google authentication failed: {error_msg}", 'error')
                return redirect('/auth/login')
            
            # Handle OAuth code flow (most common with Supabase)
            if code:
                try:
                    print(f"🔄 Processing OAuth code: {code}")
                    
                    # Use the new auth service method to handle real Google user data
                    auth_response = await auth_service.handle_oauth_code(code)
                    
                    if auth_response.success and auth_response.user:
                        print(f"✅ OAuth code exchange successful!")
                        print(f"👤 Real user data: {auth_response.user.full_name} ({auth_response.user.email})")
                        
                        # Create session using middleware helper with real user data
                        request_info = {
                            'login_method': 'google',
                            'ip_address': request.remote_addr,
                            'user_agent': request.user_agent.string
                        }
                        login_user_session(auth_response.user, remember=False, request_info=request_info)
                        
                        # Store login success data in session for success page
                        session['login_success'] = {
                            'user_name': auth_response.user.full_name,
                            'user_email': auth_response.user.email,
                            'login_method': 'google'
                        }
                        
                        # Force session save
                        session.permanent = True
                        
                        print(f"✅ Real Google user authenticated: {auth_response.user.full_name}")
                        return redirect('/auth/login-success')
                    else:
                        print(f"❌ OAuth authentication failed: {auth_response.message}")
                        flash(f'Google authentication failed: {auth_response.message}', 'error')
                        return redirect('/auth/login')
                        
                except Exception as code_error:
                    print(f"❌ OAuth callback error: {code_error}")
                    import traceback
                    print(f"📊 Full traceback: {traceback.format_exc()}")
                    flash('Failed to complete Google authentication - please try again', 'error')
                    return redirect('/auth/login')
            
            # Check if we have direct tokens (alternative flow)
            if not access_token:
                # If no tokens in query params, try to get session from Supabase
                # This might happen if Supabase automatically sets the session
                try:
                    user_response = auth_service.supabase.auth.get_user()
                    if user_response and user_response.user:
                        # User is already authenticated via Supabase session
                        user = user_response.user
                        user_metadata = user.user_metadata or {}
                        
                        # Create user response object for session
                        from models import UserResponse
                        from datetime import datetime
                        
                        user_obj = UserResponse(
                            id=user.id,
                            email=user.email,
                            full_name=user_metadata.get('full_name') or user_metadata.get('name') or 'Google User',
                            company_name=None,
                            startup_stage=None,
                            created_at=datetime.fromisoformat(user.created_at.replace('Z', '+00:00')),
                            last_sign_in_at=datetime.utcnow(),
                            email_confirmed_at=datetime.utcnow()
                        )
                        
                        # Create our local session  
                        request_info = {
                            'login_method': 'google',
                            'ip_address': request.remote_addr,
                            'user_agent': request.user_agent.string
                        }
                        login_user_session(user_obj, remember=False, request_info=request_info)
                        
                        flash('Google login successful!', 'success')
                        return redirect('/auth/login-success')
                except Exception as session_error:
                    print(f"Session check error: {session_error}")
                    import traceback
                    print(f"Session error traceback: {traceback.format_exc()}")
                
                flash('Google authentication failed - no access token received', 'error')
                return redirect('/auth/login')
            
            # Handle the OAuth callback with tokens
            response = await auth_service.handle_oauth_callback(access_token, refresh_token)
            
            if response.success:
                # Create session using middleware helper
                request_info = {
                    'login_method': 'google',
                    'ip_address': request.remote_addr,
                    'user_agent': request.user_agent.string
                }
                login_user_session(response.user, remember=False, request_info=request_info)
                
                flash(response.message, 'success')
                return redirect('/auth/login-success')
            else:
                flash(response.message, 'error')
                return redirect('/auth/login')
                
        except Exception as e:
            print(f"OAuth callback error: {e}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            flash(f"Google authentication failed: {str(e)}", 'error')
            return redirect('/auth/login')
    
    @app.route('/auth/login-success', methods=['GET'])
    def login_success():
        """Login success confirmation page"""
        # Debug session data
        print(f"🔍 Login success route - Session data: {dict(session)}")
        print(f"🔍 Session keys: {list(session.keys())}")
        print(f"🔍 Request cookies: {dict(request.cookies)}")
        print(f"🔍 Session permanent: {session.permanent} | Modified: {session.modified}")
        
        # Check if user is authenticated
        user_id = session.get('user_id')
        is_auth = session.get('is_authenticated', False)
        user_email = session.get('user_email')
        
        print(f"🔍 User ID: {user_id}")
        print(f"🔍 Is authenticated: {is_auth}")
        print(f"🔍 User email: {user_email}")
        
        # If no user in session, redirect to login
        if not user_id or not is_auth:
            print("❌ No authenticated user found, redirecting to login")
            flash('Session expired. Please log in again.', 'error')
            return redirect('/auth/login')
        
        # Get login success data from session
        success_data = session.get('login_success', {})
        
        # If no success data, create basic success info from session
        if not success_data:
            print("⚠️ No login success data, using session data")
            success_data = {
                'user_name': session.get('user_name', 'User'),
                'user_email': session.get('user_email', ''),
                'login_method': session.get('login_method', 'email')
            }
        
        print(f"✅ Showing success page for: {success_data.get('user_email')}")
        
        return render_template('login_success.html', 
                             user_name=success_data.get('user_name', 'User'),
                             user_email=success_data.get('user_email', ''),
                             login_method=success_data.get('login_method', 'email'))
    
    @app.route('/auth/reset-password', methods=['GET', 'POST', 'OPTIONS'])
    @anonymous_required
    @rate_limit_check()
    @async_route
    async def reset_password():
        """Password reset page and handler"""
        if request.method == 'GET':
            return render_template('reset_password.html')
        
        try:
            # Get form data
            data = request.get_json() or request.form.to_dict()
            
            # Validate and create reset request
            reset_request = PasswordResetRequest(**data)
            
            # Process reset
            response = await auth_service.reset_password(reset_request)
            
            if request.is_json:
                return jsonify(response.model_dump())
            
            flash(response.message, 'success' if response.success else 'error')
            return render_template('reset_password.html')
            
        except ValueError as e:
            error_msg = f"Invalid email: {str(e)}"
            if request.is_json:
                return jsonify({'success': False, 'message': error_msg}), 400
            flash(error_msg, 'error')
            return render_template('reset_password.html')
        except Exception as e:
            error_msg = f"Reset failed: {str(e)}"
            if request.is_json:
                return jsonify({'success': False, 'message': error_msg}), 500
            flash(error_msg, 'error')
            return render_template('reset_password.html')
    
    @app.route('/auth/reset-confirm', methods=['GET', 'POST'])
    def reset_confirm():
        """Handle password reset confirmation from Supabase"""
        if request.method == 'GET':
            # This route handles the redirect from Supabase after password reset
            access_token = request.args.get('access_token')
            refresh_token = request.args.get('refresh_token')
            token_type = request.args.get('token_type')
            
            print(f"Reset confirm - Access token: {bool(access_token)}")
            print(f"Reset confirm - Query params: {dict(request.args)}")
            
            if access_token:
                # Store tokens in session for password update
                session['reset_access_token'] = access_token
                session['reset_refresh_token'] = refresh_token
                return render_template('set_password.html')
            else:
                flash('Password reset link may have expired. Please request a new one.', 'error')
                return redirect('/auth/login')
        
        elif request.method == 'POST':
            # Handle password update
            try:
                # Handle both JSON and form data
                if request.is_json:
                    data = request.get_json()
                else:
                    data = request.form.to_dict()
                
                password = data.get('password')
                confirm_password = data.get('confirm_password')
                
                if not password or not confirm_password:
                    error_msg = 'Please fill in all fields.'
                    if request.is_json:
                        return jsonify({'success': False, 'message': error_msg})
                    else:
                        flash(error_msg, 'error')
                        return render_template('set_password.html')
                
                if password != confirm_password:
                    error_msg = 'Passwords do not match.'
                    if request.is_json:
                        return jsonify({'success': False, 'message': error_msg})
                    else:
                        flash(error_msg, 'error')
                        return render_template('set_password.html')
                
                if len(password) < 6:
                    error_msg = 'Password must be at least 6 characters long.'
                    if request.is_json:
                        return jsonify({'success': False, 'message': error_msg})
                    else:
                        flash(error_msg, 'error')
                        return render_template('set_password.html')
                
                # Get reset token from session
                access_token = session.get('reset_access_token')
                if not access_token:
                    error_msg = 'Reset session expired. Please request a new password reset.'
                    if request.is_json:
                        return jsonify({'success': False, 'message': error_msg})
                    else:
                        flash(error_msg, 'error')
                        return redirect('/auth/reset-password')
                
                # Update password using Supabase
                try:
                    print(f"🔑 Attempting password update with token: {access_token[:20]}...")
                    
                    # Set the session with the recovery token
                    auth_service.supabase.auth.set_session(access_token, session.get('reset_refresh_token', ''))
                    
                    # Update the password
                    response = auth_service.supabase.auth.update_user({
                        "password": password
                    })
                    
                    print(f"🔑 Update response: {response}")
                    print(f"🔑 Response user: {response.user if hasattr(response, 'user') else 'No user attr'}")
                    
                    if response and hasattr(response, 'user') and response.user:
                        print(f"✅ Password updated successfully for user: {response.user.email}")
                        
                        # Clear reset tokens
                        session.pop('reset_access_token', None)
                        session.pop('reset_refresh_token', None)
                        
                        if request.is_json:
                            return jsonify({'success': True, 'message': 'Password updated successfully!'})
                        else:
                            flash('Password updated successfully! Please login with your new password.', 'success')
                            return redirect('/auth/login')
                    else:
                        print(f"❌ Password update failed - no user in response")
                        if request.is_json:
                            return jsonify({'success': False, 'message': 'Failed to update password. Invalid response from server.'})
                        else:
                            flash('Failed to update password. Invalid response from server.', 'error')
                            return render_template('set_password.html')
                        
                except Exception as e:
                    print(f"❌ Password update error: {e}")
                    print(f"❌ Error type: {type(e)}")
                    import traceback
                    print(f"❌ Full traceback: {traceback.format_exc()}")
                    
                    if request.is_json:
                        return jsonify({'success': False, 'message': f'Failed to update password: {str(e)}'})
                    else:
                        flash(f'Failed to update password: {str(e)}', 'error')
                        return render_template('set_password.html')
                
            except Exception as e:
                print(f"Password reset error: {e}")
                if request.is_json:
                    return jsonify({'success': False, 'message': 'An error occurred. Please try again.'})
                else:
                    flash('An error occurred. Please try again.', 'error')
                    return render_template('set_password.html')
    
    @app.route('/auth/profile', methods=['GET', 'POST', 'OPTIONS'])
    @login_required
    def profile():
        """User profile page and update handler"""
        from flask import g
        
        print(f"🔍 Profile route accessed - Method: {request.method}")
        print(f"👤 Current user: {g.current_user.email if g.current_user else 'None'}")
        print(f"🔐 Is authenticated: {g.is_authenticated}")
        print(f"📋 Flask session: {dict(session)}")
        print(f"🆔 User ID from g.current_user: {g.current_user.id if g.current_user else 'None'}")
        
        if request.method == 'GET':
            # Check if request wants JSON (API) or HTML (page)
            if request.is_json or request.headers.get('Accept') == 'application/json':
                return jsonify({
                    'success': True,
                    'user': g.current_user.model_dump() if g.current_user else None
                })
            else:
                # Render the profile page
                return render_template('profile.html')
        
        try:
            # Get form data
            data = request.get_json() or request.form.to_dict()
            
            # Validate and create update request
            update_request = UserProfileUpdate(**data)
            
            # Process update (sync version for now)
            try:
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                response = loop.run_until_complete(auth_service.update_profile(g.current_user.id, update_request))
                loop.close()
            except Exception as e:
                print(f"Profile update error: {e}")
                response = type('obj', (object,), {'success': False, 'message': 'Update failed'})()
            
            if request.is_json:
                return jsonify(response.model_dump())
            else:
                if response.success:
                    flash(response.message, 'success')
                else:
                    flash(response.message, 'error')
                return redirect('/auth/profile')
            
        except ValueError as e:
            error_msg = f"Invalid input: {str(e)}"
            if request.is_json:
                return jsonify({'success': False, 'message': error_msg}), 400
            flash(error_msg, 'error')
            return redirect('/auth/profile')
        except Exception as e:
            import logging
            logging.error(f"Profile update error: {str(e)}")
            
            generic_msg = "Failed to update profile. Please try again."
            if request.is_json:
                return jsonify({'success': False, 'message': generic_msg}), 500
            flash(generic_msg, 'error')
            return redirect('/auth/profile')
    
    @app.route('/auth/validate', methods=['GET', 'OPTIONS'])
    @async_route
    async def validate_token():
        """Validate current authentication token"""
        from flask import g
        
        if g.get('is_authenticated'):
            return jsonify({
                'success': True,
                'message': 'Token is valid',
                'user': g.current_user.model_dump() if g.current_user else None
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Token is invalid or expired'
            }), 401
    
    @app.route('/auth/refresh', methods=['POST', 'OPTIONS'])
    @async_route
    async def refresh_token():
        """Refresh access token using refresh token"""
        try:
            data = request.get_json()
            if not data or 'refresh_token' not in data:
                return jsonify({
                    'success': False,
                    'message': 'Refresh token is required'
                }), 400
            
            refresh_token = data['refresh_token']
            
            # Use Supabase to refresh the token
            try:
                response = auth_service.supabase.auth.refresh_session(refresh_token)
                
                if response.session and response.user:
                    return jsonify({
                        'success': True,
                        'message': 'Token refreshed successfully',
                        'access_token': response.session.access_token,
                        'refresh_token': response.session.refresh_token,
                        'expires_in': 3600  # 1 hour
                    })
                else:
                    return jsonify({
                        'success': False,
                        'message': 'Invalid refresh token'
                    }), 401
                    
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': 'Failed to refresh token'
                }), 401
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Invalid request'
            }), 400
    
    @app.route('/auth/debug', methods=['POST'])
    def debug_signup():
        """Debug endpoint to check signup data"""
        try:
            data = request.get_json() or request.form.to_dict()
            print(f"Debug - Received data: {data}")
            print(f"Debug - Data types: {[(k, type(v)) for k, v in data.items()]}")
            
            return jsonify({
                'success': True,
                'received_data': data,
                'data_types': [(k, str(type(v))) for k, v in data.items()]
            })
        except Exception as e:
            print(f"Debug error: {e}")
            return jsonify({'success': False, 'error': str(e)})
    
    
    @app.route('/auth/debug-session', methods=['GET'])
    def debug_session():
        """Debug current session state"""
        from flask import g
        return jsonify({
            'session_data': dict(session),
            'g_is_authenticated': g.get('is_authenticated', False),
            'g_current_user': g.current_user.model_dump() if g.get('current_user') else None,
            'request_path': request.path,
            'session_keys': list(session.keys()),
            'cookies': dict(request.cookies),
            'user_agent': request.user_agent.string
        })
    
    @app.route('/auth/debug-routes', methods=['GET'])
    def debug_routes():
        """Debug endpoint to check available routes"""
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'rule': str(rule)
            })
        return jsonify({
            'success': True,
            'routes': routes,
            'host': request.host,
            'url': request.url
        })
    
    @app.route('/auth/debug-token', methods=['POST'])
    @async_route
    async def debug_get_token():
        """Debug endpoint to get a valid Supabase access token for testing"""
        try:
            data = request.get_json()
            if not data or 'email' not in data or 'password' not in data:
                return jsonify({
                    'success': False,
                    'message': 'Email and password required'
                }), 400
            
            # Direct Supabase authentication to get real tokens
            auth_response = auth_service.supabase.auth.sign_in_with_password({
                "email": data['email'],
                "password": data['password']
            })
            
            if auth_response.user and auth_response.session:
                return jsonify({
                    'success': True,
                    'access_token': auth_response.session.access_token,
                    'refresh_token': auth_response.session.refresh_token,
                    'user_id': auth_response.user.id,
                    'email': auth_response.user.email,
                    'expires_in': 3600
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Authentication failed'
                }), 401
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Debug token error: {str(e)}'
            }), 500

    @app.route('/auth/health', methods=['GET'])
    def health_check():
        """Authentication system health check"""
        from config import supabase_config
        from datetime import datetime
        
        try:
            # Check Supabase connection
            supabase_health = supabase_config.health_check()
            
            # Clean up expired sessions
            cleaned_sessions = cleanup_sessions()
            
            return jsonify({
                'success': True,
                'status': 'healthy',
                'supabase': supabase_health,
                'sessions_cleaned': cleaned_sessions,
                'timestamp': datetime.utcnow().isoformat()
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    
    # Error handlers
    @app.errorhandler(401)
    def unauthorized(error):
        if request.is_json:
            return jsonify({'success': False, 'message': 'Unauthorized access'}), 401
        return redirect('/auth/login')
    
    @app.errorhandler(403)
    def forbidden(error):
        if request.is_json:
            return jsonify({'success': False, 'message': 'Forbidden access'}), 403
        return "Access denied", 403
    
    @app.errorhandler(404)
    def not_found(error):
        if request.is_json:
            return jsonify({'success': False, 'message': 'Not found'}), 404
        return "Page not found", 404
    
    # Test route to verify server is working
    @app.route('/auth/test')
    def test():
        """Simple test route"""
        from session_store import session_store
        return jsonify({
            'status': 'Server is running!',
            'timestamp': datetime.utcnow().isoformat(),
            'session_id_exists': 'user_id' in session,
            'authenticated': session.get('is_authenticated', False),
            'session_data': dict(session),
            'cookies': dict(request.cookies),
            'session_store_stats': session_store.get_stats()
        })
    
    @app.route('/auth/test-user-id')
    def test_user_id():
        """Test user ID generation"""
        import uuid
        test_id = f"user-{uuid.uuid4().hex[:16]}"
        
        try:
            # Test UserResponse validation
            from models import UserResponse
            test_user = UserResponse(
                id=test_id,
                email="test@example.com",
                full_name="Test User",
                created_at=datetime.utcnow(),
                last_sign_in_at=datetime.utcnow(),
                email_confirmed_at=datetime.utcnow()
            )
            return jsonify({
                'status': 'success',
                'test_user_id': test_id,
                'validation': 'passed',
                'user_data': test_user.model_dump()
            })
        except Exception as e:
            return jsonify({
                'status': 'error', 
                'test_user_id': test_id,
                'validation': 'failed',
                'error': str(e)
            })
    
    @app.route('/auth/check-session')
    def check_session():
        """Check session without middleware interference"""
        from session_store import session_store
        
        session_id = session.get('session_id')
        session_data = None
        
        if session_id:
            session_data = session_store.get_session(session_id)
        
        return jsonify({
            'flask_session': dict(session),
            'session_keys': list(session.keys()),
            'user_id': session.get('user_id'),
            'is_authenticated': session.get('is_authenticated'),
            'session_id': session_id,
            'production_session': session_data,
            'cookies': dict(request.cookies),
            'session_permanent': session.permanent,
            'request_path': request.path,
            'session_store_stats': session_store.get_stats()
        })
    
    @app.route('/auth/sessions')
    @login_required
    def user_sessions():
        """View all sessions for current user"""
        from flask import g
        from session_store import session_store
        
        if not g.current_user:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_sessions = session_store.get_user_sessions(g.current_user.id)
        
        return jsonify({
            'user_id': g.current_user.id,
            'active_sessions': len(user_sessions),
            'sessions': user_sessions,
            'current_session_id': session.get('session_id')
        })
    
    # Root redirect
    @app.route('/')
    def index():
        """Root route redirects to login"""
        return redirect('/auth/login')
    
    return app

# Development server
if __name__ == '__main__':
    from datetime import datetime
    from flask import g
    
    app = create_auth_app()
    
    print("🚀 Agent-Cofounder Authentication System")
    print("⚠️  DEVELOPMENT MODE - Use a production WSGI server for deployment")
    print("🌐 Server starting at: http://localhost:5090")
    print("📝 Available routes:")
    print("   • GET  /auth/login - Login page")
    print("   • POST /auth/login - Login handler")
    print("   • GET  /auth/signup - Signup page") 
    print("   • POST /auth/signup - Signup handler")
    print("   • GET  /auth/google - Google OAuth login")
    print("   • GET  /auth/callback - OAuth callback handler")
    print("   • GET  /auth/login-success - Login confirmation page")
    print("   • POST /auth/logout - Logout handler")
    print("   • GET  /auth/reset-password - Password reset page")
    print("   • POST /auth/reset-password - Password reset handler")
    print("   • GET  /auth/profile - Get user profile")
    print("   • POST /auth/profile - Update user profile")
    print("   • GET  /auth/validate - Validate token")
    print("   • GET  /auth/debug-routes - Debug routes")
    print("   • GET  /auth/health - Health check")
    print("🔑 Google OAuth: Configured with Supabase")
    print("🔗 OAuth Callback: https://immwltgltccqefujsbbs.supabase.co/auth/v1/callback")
    print()
    
    app.run(debug=True, host='0.0.0.0', port=5090)