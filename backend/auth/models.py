#!/usr/bin/env python3
"""
Authentication Models and Schemas
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
import re

class UserSignupRequest(BaseModel):
    """User signup request model"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=12, description="User password (min 12 characters)")
    full_name: str = Field(..., min_length=2, max_length=100, description="User full name")
    company_name: Optional[str] = Field(None, max_length=100, description="Company name (optional)")
    startup_stage: Optional[str] = Field(None, description="Startup stage (idea, mvp, growth, etc.)")
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters long')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)')
        # Check for common weak passwords
        weak_patterns = ['password', '123456', 'qwerty', 'abc123', 'admin']
        if any(pattern in v.lower() for pattern in weak_patterns):
            raise ValueError('Password contains common weak patterns')
        return v
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip()

class UserLoginRequest(BaseModel):
    """User login request model"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")

class UserResponse(BaseModel):
    """User response model (safe for API responses)"""
    id: str = Field(..., description="Unique user ID (user-xxxxx format)")
    email: str = Field(..., description="User email")
    full_name: str = Field(..., description="User full name")
    company_name: Optional[str] = Field(None, description="Company name")
    startup_stage: Optional[str] = Field(None, description="Startup stage")
    avatar_url: Optional[str] = Field(None, description="Profile picture URL")
    created_at: datetime = Field(..., description="Account creation timestamp")
    last_sign_in_at: Optional[datetime] = Field(None, description="Last sign in timestamp")
    email_confirmed_at: Optional[datetime] = Field(None, description="Email confirmation timestamp")
    
    @validator('id')
    def validate_user_id(cls, v):
        """Ensure user ID follows the correct format"""
        if not v.startswith('user-'):
            raise ValueError('User ID must start with "user-"')
        if len(v) < 10:
            raise ValueError('User ID must be at least 10 characters long')
        return v

class AuthResponse(BaseModel):
    """Authentication response model"""
    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Response message")
    user: Optional[UserResponse] = Field(None, description="User data (if authenticated)")
    access_token: Optional[str] = Field(None, description="JWT access token")
    refresh_token: Optional[str] = Field(None, description="JWT refresh token")
    session_id: Optional[str] = Field(None, description="Session ID")

class PasswordResetRequest(BaseModel):
    """Password reset request model"""
    email: EmailStr = Field(..., description="User email address")


class UserProfileUpdate(BaseModel):
    """User profile update model"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100, description="User full name")
    company_name: Optional[str] = Field(None, max_length=100, description="Company name")
    startup_stage: Optional[str] = Field(None, description="Startup stage")
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip() if v else v

class SessionData(BaseModel):
    """Session data model"""
    user_id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    full_name: str = Field(..., description="User full name")
    company_name: Optional[str] = Field(None, description="Company name")
    startup_stage: Optional[str] = Field(None, description="Startup stage")
    session_id: str = Field(..., description="Session ID")
    created_at: datetime = Field(..., description="Session creation time")
    expires_at: datetime = Field(..., description="Session expiration time")
    is_active: bool = Field(True, description="Session active status")

# Startup stage options
STARTUP_STAGES = [
    "idea",
    "validation", 
    "mvp",
    "early_traction",
    "growth",
    "scaling",
    "mature"
]

# Helper functions for model validation
def validate_startup_stage(stage: str) -> bool:
    """Validate startup stage value"""
    return stage.lower() in STARTUP_STAGES

def sanitize_user_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize user input data"""
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            # Strip whitespace and convert empty strings to None
            cleaned_value = value.strip()
            sanitized[key] = cleaned_value if cleaned_value else None
        else:
            sanitized[key] = value
    return sanitized