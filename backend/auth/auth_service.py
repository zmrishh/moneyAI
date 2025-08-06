#!/usr/bin/env python3
"""
Authentication Service for Agent-Cofounder
Handles all authentication operations with Supabase
"""

import json
import secrets
import hashlib
import uuid
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from supabase import Client
from gotrue.errors import AuthApiError

from config import get_supabase_client
from models import (
    UserSignupRequest, UserLoginRequest, UserResponse, AuthResponse,
    PasswordResetRequest, UserProfileUpdate,
    SessionData, sanitize_user_input
)

class AuthenticationService:
    """Complete authentication service using Supabase"""
    
    def __init__(self):
        self.supabase: Client = get_supabase_client()
        self.session_duration = timedelta(days=7)  # 7-day session duration
    
    def _generate_user_id(self) -> str:
        """Generate ChatGPT-style unique user ID"""
        user_uuid = uuid.uuid4()
        return f"user-{user_uuid.hex[:16]}"
    
    async def signup(self, signup_data: UserSignupRequest) -> AuthResponse:
        """
        Register a new user with email and password
        """
        try:
            # Sanitize input data
            clean_data = sanitize_user_input(signup_data.model_dump())
            
            # Sign up with Supabase Auth
            auth_response = self.supabase.auth.sign_up({
                "email": clean_data["email"],
                "password": clean_data["password"],
                "options": {
                    "data": {
                        "full_name": clean_data["full_name"]
                    }
                }
            })
            
            if auth_response.user:
                # Generate our custom user ID
                custom_user_id = self._generate_user_id()
                
                # Create user profile in custom table
                user_profile = {
                    "id": custom_user_id,  # Use our custom ID
                    "supabase_id": auth_response.user.id,  # Store Supabase ID for reference
                    "email": auth_response.user.email,
                    "full_name": clean_data["full_name"],
                    "created_at": datetime.utcnow().isoformat(),
                    "last_sign_in_at": datetime.utcnow().isoformat()
                }
                
                # Store additional profile data (optional - table may not exist)
                try:
                    self.supabase.table("user_profiles").insert(user_profile).execute()
                except Exception as profile_error:
                    # This is expected if user_profiles table doesn't exist yet
                    # User data is still stored in Supabase Auth
                    pass
                
                # Create session
                session_id = self._generate_session_id()
                session_data = self._create_session_data(auth_response.user, session_id, {"full_name": clean_data["full_name"]})
                
                # Safely parse datetime fields
                try:
                    created_at = self._parse_datetime(auth_response.user.created_at)
                except:
                    created_at = datetime.utcnow()
                
                try:
                    email_confirmed_at = self._parse_datetime(auth_response.user.email_confirmed_at) if auth_response.user.email_confirmed_at else None
                except:
                    email_confirmed_at = None
                
                user_response = UserResponse(
                    id=custom_user_id,  # Use our custom user ID
                    email=auth_response.user.email,
                    full_name=clean_data["full_name"],
                    company_name=None,
                    startup_stage=None,
                    avatar_url=None,  # No avatar for email signup
                    created_at=created_at,
                    last_sign_in_at=datetime.utcnow(),
                    email_confirmed_at=email_confirmed_at
                )
                
                return AuthResponse(
                    success=True,
                    message="Account created successfully! Please check your email to verify your account.",
                    user=user_response,
                    access_token=auth_response.session.access_token if auth_response.session else None,
                    refresh_token=auth_response.session.refresh_token if auth_response.session else None,
                    session_id=session_id
                )
            else:
                return AuthResponse(
                    success=False,
                    message="Failed to create account. Please try again."
                )
                
        except AuthApiError as e:
            error_message = self._parse_auth_error(e)
            return AuthResponse(
                success=False,
                message=error_message
            )
        except Exception as e:
            return AuthResponse(
                success=False,
                message=f"An error occurred during signup: {str(e)}"
            )
    
    async def login(self, login_data: UserLoginRequest) -> AuthResponse:
        """
        Authenticate user with email and password
        """
        try:
            # Sign in with Supabase Auth
            auth_response = self.supabase.auth.sign_in_with_password({
                "email": login_data.email,
                "password": login_data.password
            })
            
            if auth_response.user and auth_response.session:
                # Get user profile data using Supabase ID to find our custom user ID
                profile_data = {}
                custom_user_id = None
                
                try:
                    # Look up user profile by Supabase ID
                    profile_response = self.supabase.table("user_profiles").select("*").eq("supabase_id", auth_response.user.id).execute()
                    if profile_response.data:
                        profile_data = profile_response.data[0]
                        custom_user_id = profile_data.get("id")
                except Exception:
                    # Table doesn't exist or no profile found
                    pass
                
                # If no custom user ID found, generate one (for existing users)
                if not custom_user_id:
                    custom_user_id = self._generate_user_id()
                    
                    # Try to create/update profile with custom ID
                    try:
                        user_profile = {
                            "id": custom_user_id,
                            "supabase_id": auth_response.user.id,
                            "email": auth_response.user.email,
                            "full_name": auth_response.user.user_metadata.get("full_name", "") if auth_response.user.user_metadata else "",
                            "last_sign_in_at": datetime.utcnow().isoformat()
                        }
                        self.supabase.table("user_profiles").upsert(user_profile).execute()
                        profile_data = user_profile
                    except Exception:
                        # Use basic data from Supabase if profile table fails
                        if hasattr(auth_response.user, 'user_metadata') and auth_response.user.user_metadata:
                            profile_data = auth_response.user.user_metadata
                        profile_data['id'] = custom_user_id
                
                # Update last sign in time (optional)
                try:
                    self.supabase.table("user_profiles").update({
                        "last_sign_in_at": datetime.utcnow().isoformat()
                    }).eq("id", custom_user_id).execute()
                except Exception:
                    pass  # Table may not exist yet
                
                # Create session
                session_id = self._generate_session_id()
                session_data = self._create_session_data(auth_response.user, session_id, profile_data)
                
                # Safely parse datetime fields
                try:
                    created_at = self._parse_datetime(auth_response.user.created_at)
                except:
                    created_at = datetime.utcnow()
                
                try:
                    email_confirmed_at = self._parse_datetime(auth_response.user.email_confirmed_at) if auth_response.user.email_confirmed_at else None
                except:
                    email_confirmed_at = None
                
                user_response = UserResponse(
                    id=custom_user_id,  # Use our custom user ID
                    email=auth_response.user.email,
                    full_name=profile_data.get("full_name", ""),
                    company_name=profile_data.get("company_name"),
                    startup_stage=profile_data.get("startup_stage"),
                    avatar_url=profile_data.get("avatar_url"),  # Include avatar from profile data
                    created_at=created_at,
                    last_sign_in_at=datetime.utcnow(),
                    email_confirmed_at=email_confirmed_at
                )
                
                return AuthResponse(
                    success=True,
                    message="Login successful!",
                    user=user_response,
                    access_token=auth_response.session.access_token,
                    refresh_token=auth_response.session.refresh_token,
                    session_id=session_id
                )
            else:
                return AuthResponse(
                    success=False,
                    message="Invalid email or password."
                )
                
        except AuthApiError as e:
            error_message = self._parse_auth_error(e)
            return AuthResponse(
                success=False,
                message=error_message
            )
        except Exception as e:
            return AuthResponse(
                success=False,
                message=f"An error occurred during login: {str(e)}"
            )
    
    async def google_login(self, redirect_url: str = None) -> str:
        """
        Initiate Google OAuth login
        Returns the Google OAuth URL to redirect to
        """
        try:
            # Set redirect URL - Supabase will handle the OAuth flow and redirect back to our app
            if not redirect_url:
                redirect_url = "http://localhost:5090/auth/callback"
            
            # Get Google OAuth URL from Supabase
            # Supabase will use https://immwltgltccqefujsbbs.supabase.co/auth/v1/callback internally
            # then redirect to our app's callback URL
            auth_response = self.supabase.auth.sign_in_with_oauth({
                "provider": "google",
                "options": {
                    "redirect_to": redirect_url
                }
            })
            
            return auth_response.url
            
        except Exception as e:
            print(f"Google OAuth initiation error: {e}")
            raise Exception(f"Failed to initiate Google login: {str(e)}")
    
    async def handle_oauth_code(self, auth_code: str) -> AuthResponse:
        """
        Handle OAuth authorization code and exchange for user session
        """
        try:
            print(f"🔄 Exchanging OAuth code: {auth_code[:20]}...")
            
            # Exchange authorization code for session
            response = self.supabase.auth.exchange_code_for_session({
                "auth_code": auth_code
            })
            
            if response and response.user and response.session:
                user = response.user
                session = response.session
                
                print(f"✅ Successfully exchanged code for user: {user.email}")
                print(f"📊 User metadata: {user.user_metadata}")
                
                # Generate our custom user ID for OAuth users
                custom_user_id = self._generate_user_id()
                
                # Extract real user data from Google OAuth
                user_metadata = user.user_metadata or {}
                
                # Get real name and profile info from Google
                full_name = (
                    user_metadata.get("full_name") or 
                    user_metadata.get("name") or 
                    f"{user_metadata.get('given_name', '')} {user_metadata.get('family_name', '')}".strip() or
                    "Google User"
                )
                
                profile_picture = (
                    user_metadata.get("avatar_url") or 
                    user_metadata.get("picture") or 
                    user_metadata.get("profile_picture")
                )
                
                # Create or update user profile with real Google data
                profile_data = {
                    "id": custom_user_id,
                    "supabase_id": user.id,
                    "email": user.email,
                    "full_name": full_name,
                    "avatar_url": profile_picture,
                    "provider": "google",
                    "google_id": user_metadata.get("sub") or user_metadata.get("google_id"),
                    "locale": user_metadata.get("locale"),
                    "verified_email": user_metadata.get("email_verified", True),
                    "created_at": datetime.utcnow().isoformat(),
                    "last_sign_in_at": datetime.utcnow().isoformat()
                }
                
                print(f"👤 Real user data extracted - Name: {full_name}, Email: {user.email}")
                
                # Try to store in custom table (optional)
                try:
                    self.supabase.table("user_profiles").upsert(profile_data).execute()
                    print("✅ User profile saved to database")
                except Exception as db_error:
                    print(f"⚠️ Could not save to database: {db_error}")
                
                # Create session
                session_id = self._generate_session_id()
                session_data = self._create_session_data(user, session_id, profile_data)
                
                # Parse datetime safely
                try:
                    created_at = self._parse_datetime(user.created_at)
                except:
                    created_at = datetime.utcnow()
                
                try:
                    email_confirmed_at = self._parse_datetime(user.email_confirmed_at) if user.email_confirmed_at else datetime.utcnow()
                except:
                    email_confirmed_at = datetime.utcnow()
                
                user_response_obj = UserResponse(
                    id=custom_user_id,
                    email=user.email,
                    full_name=full_name,  # Use real Google name
                    company_name=None,
                    startup_stage=None,
                    avatar_url=profile_picture,  # Include Google profile picture
                    created_at=created_at,
                    last_sign_in_at=datetime.utcnow(),
                    email_confirmed_at=email_confirmed_at
                )
                
                return AuthResponse(
                    success=True,
                    message=f"Google login successful! Welcome {full_name}",
                    user=user_response_obj,
                    access_token=session.access_token,
                    refresh_token=session.refresh_token,
                    session_id=session_id
                )
            else:
                print("❌ Code exchange failed - no user or session returned")
                return AuthResponse(
                    success=False,
                    message="Failed to exchange authorization code for user session"
                )
                
        except Exception as e:
            print(f"❌ OAuth code exchange error: {e}")
            import traceback
            print(f"📊 Full traceback: {traceback.format_exc()}")
            return AuthResponse(
                success=False,
                message=f"Google authentication failed: {str(e)}"
            )
    
    async def handle_oauth_callback(self, access_token: str, refresh_token: str) -> AuthResponse:
        """
        Handle OAuth callback and create user session
        """
        try:
            # Set the session with tokens from callback
            self.supabase.auth.set_session(access_token, refresh_token)
            
            # Get user info
            user_response = self.supabase.auth.get_user()
            
            if user_response.user:
                user = user_response.user
                
                # Generate our custom user ID for OAuth users
                custom_user_id = self._generate_user_id()
                
                # Extract user data from Google
                user_metadata = user.user_metadata or {}
                
                # Create or update user profile
                profile_data = {
                    "id": custom_user_id,  # Use our custom user ID
                    "supabase_id": user.id,  # Store Supabase ID for reference
                    "email": user.email,
                    "full_name": user_metadata.get("full_name") or user_metadata.get("name") or "Google User",
                    "avatar_url": user_metadata.get("avatar_url") or user_metadata.get("picture"),
                    "provider": "google",
                    "created_at": datetime.utcnow().isoformat(),
                    "last_sign_in_at": datetime.utcnow().isoformat()
                }
                
                # Try to store in custom table (optional)
                try:
                    self.supabase.table("user_profiles").upsert(profile_data).execute()
                except Exception:
                    pass  # Table may not exist
                
                # Create session
                session_id = self._generate_session_id()
                session_data = self._create_session_data(user, session_id, profile_data)
                
                # Parse datetime safely
                try:
                    created_at = self._parse_datetime(user.created_at)
                except:
                    created_at = datetime.utcnow()
                
                try:
                    email_confirmed_at = self._parse_datetime(user.email_confirmed_at) if user.email_confirmed_at else datetime.utcnow()
                except:
                    email_confirmed_at = datetime.utcnow()
                
                user_response_obj = UserResponse(
                    id=custom_user_id,  # Use our custom user ID
                    email=user.email,
                    full_name=profile_data["full_name"],
                    company_name=None,  # Can be updated later
                    startup_stage=None,  # Can be updated later
                    avatar_url=profile_data.get("avatar_url"),  # Include Google profile picture
                    created_at=created_at,
                    last_sign_in_at=datetime.utcnow(),
                    email_confirmed_at=email_confirmed_at
                )
                
                return AuthResponse(
                    success=True,
                    message="Google login successful!",
                    user=user_response_obj,
                    access_token=access_token,
                    refresh_token=refresh_token,
                    session_id=session_id
                )
            else:
                return AuthResponse(
                    success=False,
                    message="Failed to get user information from Google"
                )
                
        except Exception as e:
            print(f"OAuth callback error: {e}")
            return AuthResponse(
                success=False,
                message=f"Google login failed: {str(e)}"
            )
    
    async def logout(self, access_token: Optional[str] = None) -> AuthResponse:
        """
        Log out user and invalidate session
        """
        try:
            # Sign out from Supabase
            if access_token:
                # Set the session first
                self.supabase.auth.set_session(access_token, "")
            
            self.supabase.auth.sign_out()
            
            return AuthResponse(
                success=True,
                message="Logged out successfully!"
            )
            
        except Exception as e:
            return AuthResponse(
                success=False,
                message=f"Error during logout: {str(e)}"
            )
    
    async def get_current_user(self, access_token: str) -> Optional[UserResponse]:
        """
        Get current user from access token
        """
        try:
            # Get user directly with access token
            user_response = self.supabase.auth.get_user(access_token)
            
            if user_response and user_response.user:
                user = user_response.user
                
                # Get profile data - try to find by custom user_id first, then by supabase_id
                profile_data = {}
                try:
                    profile_response = self.supabase.table("user_profiles").select("*").eq("supabase_id", user.id).execute()
                    if profile_response.data:
                        profile_data = profile_response.data[0]
                except Exception:
                    pass  # Table may not exist or no profile found
                
                # Use custom user ID if available, otherwise generate one
                custom_user_id = profile_data.get("id") or self._generate_user_id()
                
                return UserResponse(
                    id=custom_user_id,
                    email=user.email,
                    full_name=profile_data.get("full_name", user.user_metadata.get("full_name", "") if user.user_metadata else ""),
                    company_name=profile_data.get("company_name"),
                    startup_stage=profile_data.get("startup_stage"),
                    avatar_url=profile_data.get("avatar_url"),
                    created_at=datetime.fromisoformat(user.created_at.replace('Z', '+00:00')),
                    last_sign_in_at=datetime.fromisoformat(profile_data.get("last_sign_in_at", user.created_at).replace('Z', '+00:00')),
                    email_confirmed_at=datetime.fromisoformat(user.email_confirmed_at.replace('Z', '+00:00')) if user.email_confirmed_at else None
                )
            
            return None
            
        except Exception as e:
            print(f"Error getting current user: {e}")
            return None
    
    async def reset_password(self, reset_request: PasswordResetRequest) -> AuthResponse:
        """
        Send password reset email
        """
        try:
            self.supabase.auth.reset_password_email(reset_request.email)
            
            return AuthResponse(
                success=True,
                message="Password reset email sent! Check your inbox for instructions."
            )
            
        except AuthApiError as e:
            error_message = self._parse_auth_error(e)
            return AuthResponse(
                success=False,
                message=error_message
            )
        except Exception as e:
            return AuthResponse(
                success=False,
                message=f"Error sending reset email: {str(e)}"
            )
    
    async def update_profile(self, user_id: str, update_data: UserProfileUpdate) -> AuthResponse:
        """
        Update user profile information
        """
        try:
            # Update profile in custom table
            update_dict = {}
            for field, value in update_data.model_dump(exclude_unset=True).items():
                if value is not None:
                    update_dict[field] = value
            
            if update_dict:
                self.supabase.table("user_profiles").update(update_dict).eq("id", user_id).execute()
            
            return AuthResponse(
                success=True,
                message="Profile updated successfully!"
            )
            
        except Exception as e:
            return AuthResponse(
                success=False,
                message=f"Error updating profile: {str(e)}"
            )
    
    def _generate_session_id(self) -> str:
        """Generate a secure session ID"""
        return secrets.token_urlsafe(32)
    
    def _create_session_data(self, user, session_id: str, additional_data: Dict[str, Any]) -> SessionData:
        """Create session data object"""
        now = datetime.utcnow()
        expires_at = now + self.session_duration
        
        return SessionData(
            user_id=user.id,
            email=user.email,
            full_name=additional_data.get("full_name", ""),
            company_name=additional_data.get("company_name"),
            startup_stage=additional_data.get("startup_stage"),
            session_id=session_id,
            created_at=now,
            expires_at=expires_at,
            is_active=True
        )
    
    def _parse_datetime(self, dt_string: str) -> datetime:
        """Safely parse datetime string from Supabase"""
        if not dt_string:
            return datetime.utcnow()
        
        try:
            # Handle different datetime formats from Supabase
            if dt_string.endswith('Z'):
                dt_string = dt_string.replace('Z', '+00:00')
            elif '+' not in dt_string and 'T' in dt_string:
                dt_string = dt_string + '+00:00'
            
            return datetime.fromisoformat(dt_string)
        except Exception:
            # Fallback: try parsing as timestamp
            try:
                import dateutil.parser
                return dateutil.parser.parse(dt_string)
            except:
                return datetime.utcnow()
    
    def _parse_auth_error(self, error: AuthApiError) -> str:
        """Parse Supabase auth errors into user-friendly messages"""
        error_msg = str(error).lower()
        
        if "user already registered" in error_msg or "already registered" in error_msg:
            return "An account with this email already exists. Please try logging in instead."
        elif "invalid login credentials" in error_msg or "invalid email or password" in error_msg:
            return "Invalid email or password. Please check your credentials and try again."
        elif "email not confirmed" in error_msg:
            return "Please check your email and click the confirmation link before logging in."
        elif "password should be at least" in error_msg:
            return "Password must be at least 6 characters long."
        elif "invalid email" in error_msg:
            return "Please enter a valid email address."
        elif "rate limit" in error_msg:
            return "Too many attempts. Please wait a moment before trying again."
        else:
            return f"Authentication error: {str(error)}"

# Global authentication service instance
auth_service = AuthenticationService()

# Convenience functions
async def signup_user(signup_data: UserSignupRequest) -> AuthResponse:
    """Convenience function for user signup"""
    return await auth_service.signup(signup_data)

async def login_user(login_data: UserLoginRequest) -> AuthResponse:
    """Convenience function for user login"""
    return await auth_service.login(login_data)

async def logout_user(access_token: Optional[str] = None) -> AuthResponse:
    """Convenience function for user logout"""
    return await auth_service.logout(access_token)

async def get_user_from_token(access_token: str) -> Optional[UserResponse]:
    """Convenience function to get user from token"""
    return await auth_service.get_current_user(access_token)