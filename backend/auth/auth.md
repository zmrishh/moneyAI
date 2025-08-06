# MoneyAI Backend Authentication API Documentation

## Project Overview

This is the authentication backend for MoneyAI, a financial AI application. The backend is built with Flask and provides a complete authentication system with Supabase integration, supporting both email/password and Google OAuth authentication.

## Architecture

The backend follows a modular architecture with separation of concerns:

- **Flask Application** (`app.py`) - Main application with route handlers
- **Authentication Service** (`auth_service.py`) - Business logic for authentication operations
- **Data Models** (`models.py`) - Pydantic models for request/response validation
- **Middleware** (`middleware.py`) - Authentication middleware and session management
- **Session Store** (`session_store.py`) - Production-grade session management
- **Configuration** (`config.py`) - Supabase configuration and client setup

## File Structure and Descriptions

### Core Files

#### `app.py` (Main Application)
The Flask application entry point containing all HTTP route handlers:
- **Purpose**: Main Flask app with authentication routes
- **Key Features**: User signup/login/logout handlers, Google OAuth integration, Session management, CORS support for mobile apps, Rate limiting and security headers, Debug endpoints for development

#### `auth_service.py` (Authentication Service) 
Business logic layer for all authentication operations:
- **Purpose**: Core authentication logic using Supabase
- **Key Features**: User registration and login, Google OAuth flow handling, Token validation and refresh, Password reset functionality, Profile updates, Custom user ID generation (user-xxxxx format)

#### `models.py` (Data Models)
Pydantic models for request/response validation with data validation and serialization

#### `middleware.py` (Authentication Middleware)
Flask middleware for authentication and authorization with token and session validation, route protection decorators, user context injection, rate limiting, and session helpers

#### `session_store.py` (Session Management)
Production-grade session storage system with thread-safe operations, atomic file operations, session expiration handling, user session tracking, and cleanup routines

#### `config.py` (Configuration)
Supabase client configuration and management with environment variable loading, Supabase client creation, health checks, and production/development configuration

## API Endpoints with Examples

### Authentication Routes

#### POST /auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "company_name": "Acme Corp",
  "startup_stage": "mvp"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5090/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "company_name": "Acme Corp",
    "startup_stage": "mvp"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account created successfully! Please check your email to verify your account.",
  "user": {
    "id": "user-1234567890abcdef",
    "email": "user@example.com",
    "full_name": "John Doe",
    "company_name": "Acme Corp",
    "startup_stage": "mvp",
    "avatar_url": null,
    "created_at": "2025-01-08T10:30:00Z",
    "last_sign_in_at": "2025-01-08T10:30:00Z",
    "email_confirmed_at": null
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "session_id": "sess_abc123def456"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "An account with this email already exists. Please try logging in instead."
}
```

---

#### POST /auth/login
Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5090/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful!",
  "user": {
    "id": "user-1234567890abcdef",
    "email": "user@example.com",
    "full_name": "John Doe",
    "company_name": "Acme Corp",
    "startup_stage": "mvp",
    "avatar_url": null,
    "created_at": "2025-01-07T08:15:00Z",
    "last_sign_in_at": "2025-01-08T10:30:00Z",
    "email_confirmed_at": "2025-01-07T08:20:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "session_id": "sess_xyz789uvw123"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password. Please check your credentials and try again."
}
```

---

#### POST /auth/logout
Log out the current user.

**cURL Example:**
```bash
curl -X POST http://localhost:5090/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully!"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Error during logout: Token validation failed"
}
```

---

#### GET /auth/google
Initiate Google OAuth login flow. Redirects to Google OAuth page.

**cURL Example:**
```bash
curl -X GET http://localhost:5090/auth/google
```

**Response:** HTTP 302 Redirect to Google OAuth URL

---

#### GET /auth/callback
OAuth callback handler (used by Google OAuth). Handles the callback from Google and creates user session.

**Success Response:** HTTP 302 Redirect to `/auth/login-success`

**Error Response:** HTTP 302 Redirect to `/auth/login` with error message

---

#### POST /auth/reset-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5090/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent! Check your inbox for instructions."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Please enter a valid email address."
}
```

---

### User Management Routes

#### GET /auth/profile
Get current user profile information.

**cURL Example:**
```bash
curl -X GET http://localhost:5090/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-1234567890abcdef",
    "email": "user@example.com",
    "full_name": "John Doe",
    "company_name": "Acme Corp",
    "startup_stage": "mvp",
    "avatar_url": "https://lh3.googleusercontent.com/a/profile.jpg",
    "created_at": "2025-01-07T08:15:00Z",
    "last_sign_in_at": "2025-01-08T10:30:00Z",
    "email_confirmed_at": "2025-01-07T08:20:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Authentication required",
  "error_code": "AUTH_REQUIRED"
}
```

---

#### POST /auth/profile
Update user profile information.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "company_name": "New Company",
  "startup_stage": "growth"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5090/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "full_name": "John Smith",
    "company_name": "New Company",
    "startup_stage": "growth"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully!"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid input: Full name cannot be empty"
}
```

---

#### GET /auth/validate
Validate current authentication token.

**cURL Example:**
```bash
curl -X GET http://localhost:5090/auth/validate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": "user-1234567890abcdef",
    "email": "user@example.com",
    "full_name": "John Doe",
    "company_name": "Acme Corp",
    "startup_stage": "mvp",
    "avatar_url": null,
    "created_at": "2025-01-07T08:15:00Z",
    "last_sign_in_at": "2025-01-08T10:30:00Z",
    "email_confirmed_at": "2025-01-07T08:20:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Token is invalid or expired"
}
```

---

### Utility Routes

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5090/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

---

#### GET /auth/health
Health check for the authentication system.

**cURL Example:**
```bash
curl -X GET http://localhost:5090/auth/health
```

**Success Response (200):**
```json
{
  "success": true,
  "status": "healthy",
  "supabase": {
    "status": "healthy",
    "url": "https://immwltgltccqefujsbbs.supabase.co",
    "connected": true
  },
  "sessions_cleaned": 3,
  "timestamp": "2025-01-08T10:30:00Z"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "status": "error",
  "error": "Connection timeout",
  "timestamp": "2025-01-08T10:30:00Z"
}
```

---

#### GET /auth/sessions
View all active sessions for the current user.

**cURL Example:**
```bash
curl -X GET http://localhost:5090/auth/sessions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "user_id": "user-1234567890abcdef",
  "active_sessions": 2,
  "sessions": [
    {
      "session_id": "sess_abc123def456",
      "created_at": "2025-01-08T09:00:00Z",
      "expires_at": "2025-01-09T09:00:00Z",
      "last_accessed": "2025-01-08T10:30:00Z",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "login_method": "email"
    },
    {
      "session_id": "sess_xyz789uvw123",
      "created_at": "2025-01-08T08:00:00Z",
      "expires_at": "2025-01-09T08:00:00Z",
      "last_accessed": "2025-01-08T10:15:00Z",
      "ip_address": "192.168.1.101",
      "user_agent": "MoneyAI Mobile App",
      "login_method": "google"
    }
  ],
  "current_session_id": "sess_abc123def456"
}
```

---

### Debug Routes (Development Only)

#### GET /auth/debug-session
Debug current session state.

**cURL Example:**
```bash
curl -X GET http://localhost:5090/auth/debug-session
```

**Response (200):**
```json
{
  "session_data": {
    "session_id": "sess_abc123def456",
    "user_id": "user-1234567890abcdef",
    "is_authenticated": true
  },
  "g_is_authenticated": true,
  "g_current_user": {
    "id": "user-1234567890abcdef",
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "request_path": "/auth/debug-session",
  "session_keys": ["session_id", "user_id", "is_authenticated"],
  "cookies": {
    "auth_session": "sess_abc123def456"
  },
  "user_agent": "curl/7.68.0"
}
```

---

#### GET /auth/debug-routes
List all available routes.

**cURL Example:**
```bash
curl -X GET http://localhost:5090/auth/debug-routes
```

**Response (200):**
```json
{
  "success": true,
  "routes": [
    {
      "endpoint": "signup",
      "methods": ["GET", "POST", "OPTIONS"],
      "rule": "/auth/signup"
    },
    {
      "endpoint": "login",
      "methods": ["GET", "POST", "OPTIONS"],
      "rule": "/auth/login"
    },
    {
      "endpoint": "logout",
      "methods": ["GET", "POST", "OPTIONS"],
      "rule": "/auth/logout"
    }
  ],
  "host": "localhost:5090",
  "url": "http://localhost:5090/auth/debug-routes"
}
```

---

#### POST /auth/debug-token
Get authentication token for testing.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5090/auth/debug-token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "d1234567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "expires_in": 3600
}
```

---

#### GET /auth/test
Simple server test endpoint.

**cURL Example:**
```bash
curl -X GET http://localhost:5090/auth/test
```

**Response (200):**
```json
{
  "status": "Server is running!",
  "timestamp": "2025-01-08T10:30:00Z",
  "session_id_exists": true,
  "authenticated": true,
  "session_data": {
    "session_id": "sess_abc123def456",
    "user_id": "user-1234567890abcdef",
    "is_authenticated": true
  },
  "cookies": {
    "auth_session": "sess_abc123def456"
  },
  "session_store_stats": {
    "total_sessions": 5,
    "active_sessions": 3,
    "expired_sessions": 2,
    "last_cleanup": "2025-01-08T10:00:00Z"
  }
}
```

---

#### GET /auth/check-session
Check session without middleware interference.

**cURL Example:**
```bash
curl -X GET http://localhost:5090/auth/check-session
```

**Response (200):**
```json
{
  "flask_session": {
    "session_id": "sess_abc123def456",
    "user_id": "user-1234567890abcdef",
    "is_authenticated": true
  },
  "session_keys": ["session_id", "user_id", "is_authenticated"],
  "user_id": "user-1234567890abcdef",
  "is_authenticated": true,
  "session_id": "sess_abc123def456",
  "production_session": {
    "session_id": "sess_abc123def456",
    "user_id": "user-1234567890abcdef",
    "user_email": "user@example.com",
    "user_name": "John Doe",
    "created_at": "2025-01-08T09:00:00Z",
    "expires_at": "2025-01-09T09:00:00Z",
    "last_accessed": "2025-01-08T10:30:00Z",
    "active": true
  },
  "cookies": {
    "auth_session": "sess_abc123def456"
  },
  "session_permanent": true,
  "request_path": "/auth/check-session",
  "session_store_stats": {
    "total_sessions": 5,
    "active_sessions": 3,
    "expired_sessions": 2,
    "last_cleanup": "2025-01-08T10:00:00Z"
  }
}
```

---

## Complete Testing Flow

### End-to-End Authentication Test

```bash
# 1. Register new user
curl -X POST http://localhost:5090/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "full_name": "Test User",
    "company_name": "Test Corp",
    "startup_stage": "idea"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "Account created successfully! Please check your email to verify your account.",
#   "user": {...},
#   "access_token": "eyJ...",
#   "session_id": "sess_..."
# }

# 2. Login to get fresh token
curl -X POST http://localhost:5090/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "Login successful!",
#   "user": {...},
#   "access_token": "eyJ...",
#   "session_id": "sess_..."
# }

# 3. Use token to access protected route (replace YOUR_ACCESS_TOKEN)
curl -X GET http://localhost:5090/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected Response:
# {
#   "success": true,
#   "user": {
#     "id": "user-...",
#     "email": "test@example.com",
#     "full_name": "Test User",
#     ...
#   }
# }

# 4. Update profile
curl -X POST http://localhost:5090/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "full_name": "Updated Test User",
    "startup_stage": "mvp"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "Profile updated successfully!"
# }

# 5. Validate token
curl -X GET http://localhost:5090/auth/validate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected Response:
# {
#   "success": true,
#   "message": "Token is valid",
#   "user": {...}
# }

# 6. Check health
curl -X GET http://localhost:5090/auth/health

# Expected Response:
# {
#   "success": true,
#   "status": "healthy",
#   "supabase": {...},
#   "sessions_cleaned": 0,
#   "timestamp": "..."
# }

# 7. Logout
curl -X POST http://localhost:5090/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected Response:
# {
#   "success": true,
#   "message": "Logged out successfully!"
# }
```

## Error Handling

The API returns standardized error responses with appropriate HTTP status codes:

### Common Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation error: Password must be at least 6 characters long"
}
```

**Authentication Required (401):**
```json
{
  "success": false,
  "message": "Authentication required",
  "error_code": "AUTH_REQUIRED"
}
```

**Rate Limited (429):**
```json
{
  "success": false,
  "message": "Too many attempts. Please try again later."
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "An error occurred during signup. Please try again."
}
```

## Environment Configuration

### Required Environment Variables

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your_supabase_anon_key
GOOGLE_API_KEY=your_google_oauth_key
ENVIRONMENT=development  # or production
SECRET_KEY=your_flask_secret_key
```

## Running the Server

### Development Mode
```bash
cd backend/auth
python app.py
```

Server runs on `http://localhost:5090`

### Production Mode
Use a production WSGI server like Gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:5090 app:app
```

## Security Features

- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: Cross-site request forgery prevention
- **Secure Sessions**: Production-grade session management with file locking
- **Token Validation**: JWT token verification with Supabase
- **Password Security**: Handled by Supabase with industry standards
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Security Headers**: HTTP security headers for protection

## Integration Examples

### Frontend JavaScript Integration
```javascript
// Login request
const response = await fetch('http://localhost:5090/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
if (data.success) {
  // Store tokens
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  
  // Use token for subsequent requests
  const profileResponse = await fetch('http://localhost:5090/auth/profile', {
    headers: {
      'Authorization': `Bearer ${data.access_token}`
    }
  });
}
```

### React Native Integration
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Login function
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5090/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      await AsyncStorage.setItem('access_token', data.access_token);
      await AsyncStorage.setItem('refresh_token', data.refresh_token);
      return data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```