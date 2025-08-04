#!/usr/bin/env python3
"""
Production-Grade Session Store for Agent-Cofounder
Redis-like behavior with file fallback for development
"""

import json
import uuid
import hashlib
import secrets
import threading
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from pathlib import Path
import fcntl
import time

class ProductionSessionStore:
    """Production-grade session store with atomic operations and thread safety"""
    
    def __init__(self, 
                 session_duration: timedelta = timedelta(hours=24),
                 cleanup_interval: timedelta = timedelta(hours=1)):
        self.session_duration = session_duration
        self.cleanup_interval = cleanup_interval
        self.store_file = Path("auth/sessions.json")
        self.store_file.parent.mkdir(exist_ok=True)
        
        # Thread safety
        self._lock = threading.RLock()
        self._sessions = {}
        self._last_cleanup = datetime.utcnow()
        
        # Load existing sessions
        self._load_sessions()
        
    def _generate_session_id(self) -> str:
        """Generate cryptographically secure session ID"""
        # Generate a secure random token
        random_bytes = secrets.token_bytes(32)
        timestamp = str(int(time.time() * 1000000))  # microsecond precision
        
        # Combine with timestamp for uniqueness
        combined = random_bytes + timestamp.encode()
        
        # Hash to get consistent length
        session_hash = hashlib.sha256(combined).hexdigest()
        
        # Format as sess_<hash> for easy identification
        return f"sess_{session_hash[:32]}"
    
    def _generate_user_id(self) -> str:
        """Generate ChatGPT-style unique user ID"""
        # Generate UUID4 for global uniqueness
        user_uuid = uuid.uuid4()
        
        # Format as user-<uuid> like ChatGPT (user-1234567890abcdef...)
        return f"user-{user_uuid.hex[:16]}"
    
    def _load_sessions(self):
        """Load sessions from persistent storage with file locking"""
        try:
            if not self.store_file.exists():
                self._sessions = {}
                return
                
            with open(self.store_file, 'r') as f:
                # Use file locking for atomic reads
                fcntl.flock(f.fileno(), fcntl.LOCK_SH)
                try:
                    data = json.load(f)
                    # Clean expired sessions on load
                    self._sessions = self._clean_expired(data)
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
                    
        except (json.JSONDecodeError, FileNotFoundError):
            self._sessions = {}
        except Exception as e:
            print(f"Session store load error: {e}")
            self._sessions = {}
    
    def _save_sessions(self):
        """Save sessions to persistent storage with atomic write"""
        try:
            # Write to temporary file first (atomic operation)
            temp_file = self.store_file.with_suffix('.tmp')
            
            with open(temp_file, 'w') as f:
                # Use file locking for atomic writes
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    json.dump(self._sessions, f, default=str, indent=2)
                    f.flush()
                    # Force write to disk (cross-platform compatible)
                    try:
                        f.fsync()
                    except (AttributeError, OSError):
                        # Fallback for systems where fsync is not available on TextIOWrapper
                        import os
                        os.fsync(f.fileno())
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
            
            # Atomic rename (POSIX guarantee)
            temp_file.replace(self.store_file)
            
        except Exception as e:
            print(f"Session store save error: {e}")
    
    def _clean_expired(self, sessions: Dict[str, Any]) -> Dict[str, Any]:
        """Remove expired sessions"""
        now = datetime.utcnow()
        active_sessions = {}
        
        for session_id, session_data in sessions.items():
            try:
                expires_at = datetime.fromisoformat(session_data['expires_at'])
                if expires_at > now and session_data.get('active', True):
                    active_sessions[session_id] = session_data
            except (ValueError, KeyError, TypeError):
                # Skip malformed session data
                continue
        
        return active_sessions
    
    def _cleanup_if_needed(self):
        """Run cleanup if interval has passed"""
        now = datetime.utcnow()
        if now - self._last_cleanup > self.cleanup_interval:
            self.cleanup_expired_sessions()
            self._last_cleanup = now
    
    def create_session(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new session with production-grade security"""
        with self._lock:
            self._cleanup_if_needed()
            
            # Generate unique IDs
            session_id = self._generate_session_id()
            
            # If user doesn't have an ID, generate one
            user_id = user_data.get('id')
            if not user_id or not user_id.startswith('user-'):
                user_id = self._generate_user_id()
            
            now = datetime.utcnow()
            expires_at = now + self.session_duration
            
            # Create session data
            session_data = {
                'session_id': session_id,
                'user_id': user_id,
                'user_email': user_data.get('email', ''),
                'user_name': user_data.get('full_name', ''),
                'company_name': user_data.get('company_name'),
                'startup_stage': user_data.get('startup_stage'),
                'avatar_url': user_data.get('avatar_url'),  # Include avatar URL in session
                'created_at': now.isoformat(),
                'expires_at': expires_at.isoformat(),
                'last_accessed': now.isoformat(),
                'ip_address': user_data.get('ip_address'),
                'user_agent': user_data.get('user_agent'),
                'active': True,
                'login_method': user_data.get('login_method', 'email')
            }
            
            # Store session
            self._sessions[session_id] = session_data
            self._save_sessions()
            
            print(f"✅ Session created: {session_id} for user: {user_id} | Email: {user_data.get('email', 'N/A')} | Method: {user_data.get('login_method', 'N/A')}")
            return session_data
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID with automatic cleanup"""
        with self._lock:
            self._cleanup_if_needed()
            
            if session_id not in self._sessions:
                return None
            
            session_data = self._sessions[session_id]
            
            # Check if expired
            try:
                expires_at = datetime.fromisoformat(session_data['expires_at'])
                if datetime.utcnow() > expires_at or not session_data.get('active', True):
                    self.invalidate_session(session_id)
                    return None
            except (ValueError, KeyError):
                self.invalidate_session(session_id)
                return None
            
            # Update last accessed time
            session_data['last_accessed'] = datetime.utcnow().isoformat()
            self._sessions[session_id] = session_data
            
            print(f"📊 Session accessed: {session_id} | User: {session_data.get('user_email', 'N/A')} | Valid until: {session_data.get('expires_at', 'N/A')}")
            return session_data
    
    def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session data"""
        with self._lock:
            if session_id not in self._sessions:
                return False
            
            session_data = self._sessions[session_id]
            session_data.update(updates)
            session_data['last_accessed'] = datetime.utcnow().isoformat()
            
            self._sessions[session_id] = session_data
            self._save_sessions()
            return True
    
    def invalidate_session(self, session_id: str) -> bool:
        """Invalidate a specific session"""
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                self._save_sessions()
                print(f"🗑️ Session invalidated: {session_id}")
                return True
            return False
    
    def invalidate_user_sessions(self, user_id: str) -> int:
        """Invalidate all sessions for a user"""
        with self._lock:
            sessions_to_remove = []
            
            for sid, session_data in self._sessions.items():
                if session_data.get('user_id') == user_id:
                    sessions_to_remove.append(sid)
            
            for sid in sessions_to_remove:
                del self._sessions[sid]
            
            if sessions_to_remove:
                self._save_sessions()
                print(f"🗑️ Invalidated {len(sessions_to_remove)} sessions for user: {user_id}")
            
            return len(sessions_to_remove)
    
    def refresh_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Refresh session expiration time"""
        with self._lock:
            session_data = self.get_session(session_id)
            if not session_data:
                return None
            
            # Extend expiration
            new_expires = datetime.utcnow() + self.session_duration
            session_data['expires_at'] = new_expires.isoformat()
            session_data['last_accessed'] = datetime.utcnow().isoformat()
            
            self._sessions[session_id] = session_data
            self._save_sessions()
            
            return session_data
    
    def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions and return count removed"""
        with self._lock:
            original_count = len(self._sessions)
            self._sessions = self._clean_expired(self._sessions)
            removed_count = original_count - len(self._sessions)
            
            if removed_count > 0:
                self._save_sessions()
                print(f"🧹 Cleaned up {removed_count} expired sessions")
            
            return removed_count
    
    def get_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all active sessions for a user"""
        with self._lock:
            user_sessions = []
            
            for session_data in self._sessions.values():
                if session_data.get('user_id') == user_id:
                    # Verify session is still valid
                    if self.get_session(session_data['session_id']):
                        user_sessions.append(session_data)
            
            return user_sessions
    
    def get_stats(self) -> Dict[str, Any]:
        """Get session store statistics"""
        with self._lock:
            now = datetime.utcnow()
            active_count = 0
            expired_count = 0
            
            for session_data in self._sessions.values():
                try:
                    expires_at = datetime.fromisoformat(session_data['expires_at'])
                    if expires_at > now and session_data.get('active', True):
                        active_count += 1
                    else:
                        expired_count += 1
                except:
                    expired_count += 1
            
            return {
                'total_sessions': len(self._sessions),
                'active_sessions': active_count,
                'expired_sessions': expired_count,
                'last_cleanup': self._last_cleanup.isoformat()
            }

# Global session store instance
session_store = ProductionSessionStore()

# Convenience functions
def create_user_session(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create session for user"""
    return session_store.create_session(user_data)

def get_session_by_id(session_id: str) -> Optional[Dict[str, Any]]:
    """Get session by ID"""
    return session_store.get_session(session_id)

def invalidate_session(session_id: str) -> bool:
    """Invalidate session"""
    return session_store.invalidate_session(session_id)

def cleanup_sessions() -> int:
    """Clean up expired sessions"""
    return session_store.cleanup_expired_sessions()